from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import httpx
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# API keys from environment only - never hardcode secrets
FDA_API_KEY = os.getenv("FDA_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Healthcare Drug Interaction Analyzer")

# Configure CORS - restrict to known origins; override via ALLOWED_ORIGINS env var
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class DrugAnalysisRequest(BaseModel):
    medications: List[str]
    diagnosis: str
    symptoms: List[str]


class DrugInfo(BaseModel):
    brand_name: str
    generic_name: Optional[str] = None
    warnings: List[str] = []
    contraindications: List[str] = []
    adverse_reactions: List[str] = []
    drug_interactions: List[str] = []
    indications_and_usage: List[str] = []


class SymptomAnalysisRequest(BaseModel):
    diagnosis: str
    symptoms: List[str]


class EmailRequest(BaseModel):
    to: str
    subject: str
    message: str


def _extract_json(content: str) -> str:
    """Extract JSON from a string that may contain markdown code blocks."""
    if "```json" in content and "```" in content.split("```json", 1)[1]:
        return content.split("```json", 1)[1].split("```", 1)[0].strip()
    if "```" in content and "```" in content.split("```", 1)[1]:
        return content.split("```", 1)[1].split("```", 1)[0].strip()
    return content


async def analyze_with_gemini(drug_infos: List[DrugInfo], prompt: str) -> Dict:
    """Use Gemini API to analyze drug interactions and conflicts."""
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={"temperature": 0.1, "max_output_tokens": 1000},
        )
        response = model.generate_content(prompt)
        if not response:
            return {"error": "Empty response from Gemini API"}

        content = _extract_json(response.text)
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"analysis": response.text}

    except Exception as e:
        return {"error": f"Error using Gemini API: {str(e)}"}


async def generate_differential_diagnosis(symptoms: List[str], diagnosis: str) -> Dict:
    """Use Gemini API to generate differential diagnoses based on symptoms."""
    prompt = f"""
    Based on the following symptoms: {', '.join(symptoms)}

    The current diagnosis is: {diagnosis}

    Please provide:
    1. A similarity assessment for the current diagnosis, including:
       - A similarity score (0.0 to 1.0)
       - Which specific symptoms match this diagnosis
       - A brief assessment given the symptoms
    2. A list of potential alternative diagnoses with:
       - Condition name
       - A similarity score (0.0 to 1.0)
       - Which specific symptoms match
       - A brief explanation

    Your response must be a valid JSON object with this exact structure:
    {{
        "diagnosis_similarity": 0.8,
        "matching_symptoms": ["symptom1", "symptom2"],
        "diagnosis_assessment": "Brief assessment of current diagnosis",
        "alternatives": [
            {{
                "condition": "Condition Name",
                "similarity_score": 0.8,
                "matching_symptoms": ["symptom1", "symptom2"],
                "explanation": "Brief explanation"
            }}
        ]
    }}

    IMPORTANT: Return ONLY the JSON object without any explanations, markdown formatting, or additional text.
    """

    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={"temperature": 0.2, "max_output_tokens": 1000},
        )
        response = model.generate_content(prompt)
        if not response:
            return {"error": "Empty response from Gemini API"}

        content = _extract_json(response.text)
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "Could not parse differential diagnosis JSON", "raw_content": response.text}

    except Exception as e:
        return {"error": f"Error generating differential diagnosis: {str(e)}"}


def _fda_params(extra: dict) -> dict:
    params = dict(extra)
    if FDA_API_KEY:
        params["api_key"] = FDA_API_KEY
    return params


@app.get("/")
async def read_root():
    return {"message": "Welcome to Healthcare Drug Interaction Analyzer API"}


@app.post("/api/analyze-drugs")
async def analyze_drugs(request: DrugAnalysisRequest):
    drug_infos: List[DrugInfo] = []
    basic_conflicts = []

    async with httpx.AsyncClient() as client:
        for medication in request.medications:
            try:
                response = await client.get(
                    "https://api.fda.gov/drug/label.json",
                    params=_fda_params({"search": f'openfda.brand_name:"{medication}"'}),
                )
                response.raise_for_status()
                data = response.json()

                if data.get("results"):
                    drug_info = data["results"][0]
                    openfda = drug_info.get("openfda", {})
                    generic_name = openfda["generic_name"][0] if openfda.get("generic_name") else None
                    drug_infos.append(DrugInfo(
                        brand_name=medication,
                        generic_name=generic_name,
                        warnings=drug_info.get("warnings", []),
                        contraindications=drug_info.get("contraindications", []),
                        adverse_reactions=drug_info.get("adverse_reactions", []),
                        drug_interactions=drug_info.get("drug_interactions", []),
                        indications_and_usage=drug_info.get("indications_and_usage", []),
                    ))
                else:
                    drug_infos.append(DrugInfo(
                        brand_name=medication,
                        warnings=["No FDA data available for this medication"],
                    ))
            except httpx.HTTPStatusError as e:
                drug_infos.append(DrugInfo(
                    brand_name=medication,
                    warnings=[f"HTTP error retrieving information: {e.response.status_code}"],
                ))
            except Exception as e:
                drug_infos.append(DrugInfo(
                    brand_name=medication,
                    warnings=[f"Error retrieving information: {str(e)}"],
                ))

    # Basic conflict detection
    try:
        for i, drug1 in enumerate(drug_infos):
            for drug2 in drug_infos[i + 1:]:
                if drug1.generic_name and drug2.generic_name:
                    for interaction in drug1.drug_interactions:
                        if drug2.generic_name.lower() in interaction.lower():
                            basic_conflicts.append({
                                "drug1": drug1.brand_name, "drug2": drug2.brand_name,
                                "type": "explicit_interaction", "details": [interaction],
                            })
                    for interaction in drug2.drug_interactions:
                        if drug1.generic_name.lower() in interaction.lower():
                            basic_conflicts.append({
                                "drug1": drug1.brand_name, "drug2": drug2.brand_name,
                                "type": "explicit_interaction", "details": [interaction],
                            })

                common_contra = set(drug1.contraindications) & set(drug2.contraindications)
                if common_contra:
                    basic_conflicts.append({
                        "drug1": drug1.brand_name, "drug2": drug2.brand_name,
                        "type": "contraindication", "details": list(common_contra),
                    })

                common_warn = set(drug1.warnings) & set(drug2.warnings)
                if common_warn:
                    basic_conflicts.append({
                        "drug1": drug1.brand_name, "drug2": drug2.brand_name,
                        "type": "warning", "details": list(common_warn),
                    })
    except Exception as e:
        print(f"Error during basic conflict analysis: {e}")

    drug_data = [
        {
            "brand_name": d.brand_name, "generic_name": d.generic_name,
            "warnings": d.warnings, "contraindications": d.contraindications,
            "adverse_reactions": d.adverse_reactions, "drug_interactions": d.drug_interactions,
        }
        for d in drug_infos
    ]

    prompt = f"""
    Analyze these medications for interactions, diagnosis contradictions, and warnings.

    Diagnosis: {request.diagnosis}
    Symptoms: {', '.join(request.symptoms)}
    Drug data: {json.dumps(drug_data, indent=2)}

    Return ONLY a JSON object:
    {{
        "advanced_conflicts": [{{"drugs": ["Drug1","Drug2"],"type":"...","severity":"high/medium/low","description":"..."}}],
        "diagnosis_contradictions": [{{"drug":"...","contradiction":"..."}}],
        "additional_warnings": [{{"warning":"...","drugs":["Drug1"]}}]
    }}
    """

    try:
        advanced_analysis = await analyze_with_gemini(drug_infos, prompt)
    except Exception as e:
        advanced_analysis = {
            "error": str(e),
            "advanced_conflicts": [],
            "diagnosis_contradictions": [],
            "additional_warnings": [],
        }

    return {
        "drug_infos": [drug.dict() for drug in drug_infos],
        "basic_conflicts": basic_conflicts,
        "advanced_analysis": advanced_analysis,
    }


@app.post("/api/analyze-symptoms")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """Analyze symptoms and provide differential diagnoses."""
    try:
        return await generate_differential_diagnosis(request.symptoms, request.diagnosis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")


@app.get("/api/drug-info/{drug_name}")
async def get_drug_info(drug_name: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.fda.gov/drug/label.json",
                params=_fda_params({"search": f'openfda.brand_name:"{drug_name}"'}),
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("results"):
                raise HTTPException(status_code=404, detail=f"Drug not found: {drug_name}")

            drug_info = data["results"][0]
            openfda = drug_info.get("openfda", {})

            result = {
                "brand_name": drug_name,
                "generic_name": openfda.get("generic_name", [""])[0] if openfda.get("generic_name") else None,
                "manufacturer": openfda.get("manufacturer_name", [""])[0] if openfda.get("manufacturer_name") else None,
                "product_type": openfda.get("product_type", [""])[0] if openfda.get("product_type") else None,
                "route": openfda.get("route", [""])[0] if openfda.get("route") else None,
                "warnings": drug_info.get("warnings", []),
                "contraindications": drug_info.get("contraindications", []),
                "adverse_reactions": drug_info.get("adverse_reactions", []),
                "drug_interactions": drug_info.get("drug_interactions", []),
                "boxed_warnings": drug_info.get("boxed_warning", []),
                "indications_and_usage": drug_info.get("indications_and_usage", []),
                "dosage_and_administration": drug_info.get("dosage_and_administration", []),
            }

            prompt = f"""
            Provide enhanced patient-friendly information about {drug_name}.
            Generic: {result.get('generic_name')}
            Warnings: {result.get('warnings')}
            Contraindications: {result.get('contraindications')}

            Return ONLY this JSON:
            {{"summary":"...","key_warnings_explanation":"...","special_considerations":"..."}}
            """

            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config={"temperature": 0.1, "max_output_tokens": 1000},
            )
            ai_response = model.generate_content(prompt)
            if ai_response:
                try:
                    result["enhanced_info"] = json.loads(_extract_json(ai_response.text))
                except json.JSONDecodeError:
                    result["enhanced_info"] = {"summary": ai_response.text}

            return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drug info: {str(e)}")


@app.get("/api/search-drugs")
async def search_drugs(term: str, limit: int = 10):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.fda.gov/drug/label.json",
                params=_fda_params({"search": f'openfda.brand_name:"{term}"~', "limit": min(limit, 50)}),
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("results", []):
                openfda = item.get("openfda", {})
                results.append({
                    "brand_name": openfda.get("brand_name", [""])[0] if openfda.get("brand_name") else "",
                    "generic_name": openfda.get("generic_name", [""])[0] if openfda.get("generic_name") else "",
                    "manufacturer": openfda.get("manufacturer_name", [""])[0] if openfda.get("manufacturer_name") else "",
                    "product_type": openfda.get("product_type", [""])[0] if openfda.get("product_type") else "",
                })
            return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching drugs: {str(e)}")


@app.get("/api/drug-adverse-events")
async def get_drug_adverse_events(drug_name: str, limit: int = 10):
    """Get adverse events reported for a specific drug."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.fda.gov/drug/event.json",
                params=_fda_params({
                    "search": f'patient.drug.medicinalproduct:"{drug_name}"',
                    "limit": min(limit, 50),
                }),
            )
            response.raise_for_status()
            data = response.json()

            events = []
            for report in data.get("results", []):
                patient = report.get("patient", {})
                reactions = patient.get("reaction", [])
                events.append({
                    "report_id": report.get("safetyreportid", "Unknown"),
                    "report_date": report.get("receiptdate", "Unknown"),
                    "reactions": [r.get("reactionmeddrapt", "Unknown") for r in reactions],
                    "serious": report.get("serious", "Unknown"),
                    "outcome": patient.get("patientoutcome", "Unknown"),
                })
            return {"events": events}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching adverse events: {str(e)}")


@app.post("/api/send-email")
async def send_email(request: EmailRequest):
    """Send an email using the Resend API."""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email service not configured")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json={
                    "from": "onboarding@resend.dev",
                    "to": [request.to],
                    "subject": request.subject,
                    "text": request.message,
                },
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            response_data = response.json()
            if response.status_code == 200:
                return {"success": True, "message": "Email sent successfully"}
            return {
                "success": False,
                "message": f"Failed to send email: {response_data.get('message', 'Unknown error')}",
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")
