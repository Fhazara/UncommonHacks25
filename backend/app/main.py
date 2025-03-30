from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import json
import socket
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# OpenFDA API key
FDA_API_KEY = "2TgfPfbXvEZTKHoRZcABpxnGJ5XbJeUzNIMaCgVP"

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Healthcare Drug Interaction Analyzer")

# Get local IP address
def get_local_ip():
    try:
        # Get the local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

async def analyze_with_gemini(drug_infos: List[DrugInfo], prompt: str) -> Dict:
    """
    Use Gemini API to analyze drug interactions and conflicts
    """
    try:
        # Create a model instance
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 1000,
            },
        )
        
        # Generate text
        response = model.generate_content(prompt)
        
        if not response:
            return {"error": "Empty response from Gemini API"}
        
        content = response.text
        print(f"Gemini API response: {content}")
        
        # Try to parse JSON
        try:
            # Sometimes Gemini might include markdown code blocks - try to extract JSON
            if "```json" in content and "```" in content.split("```json", 1)[1]:
                content = content.split("```json", 1)[1].split("```", 1)[0].strip()
            elif "```" in content and "```" in content.split("```", 1)[1]:
                content = content.split("```", 1)[1].split("```", 1)[0].strip()
                
            result = json.loads(content)
            return result
        except json.JSONDecodeError as e:
            # If not valid JSON, return the raw content
            print(f"JSON parsing error: {str(e)}")
            return {"analysis": content}
            
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        return {"error": f"Error using Gemini API: {str(e)}"}

async def generate_differential_diagnosis(symptoms: List[str], diagnosis: str) -> Dict:
    """
    Use Gemini API to generate differential diagnoses based on symptoms
    """
    prompt = f"""
    Based on the following symptoms: {', '.join(symptoms)}
    
    The current diagnosis is: {diagnosis}
    
    Please generate a list of potential alternative diagnoses that could explain these symptoms.
    For each alternative diagnosis, provide:
    1. Condition name
    2. A similarity score (0.0 to 1.0) representing how well the symptoms match
    3. Which specific symptoms match this condition
    4. A brief explanation for why this could be an alternative diagnosis
    
    Your response must be a valid JSON object with this exact structure:
    {{
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
        # Create a model instance
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 1000,
            },
        )
        
        # Generate text
        response = model.generate_content(prompt)
        
        if not response:
            return {"error": "Empty response from Gemini API"}
        
        content = response.text
        print(f"Gemini symptom analysis response: {content}")
        
        # Try to parse JSON from the response
        try:
            # Sometimes Gemini might include markdown code blocks - try to extract JSON
            if "```json" in content and "```" in content.split("```json", 1)[1]:
                content = content.split("```json", 1)[1].split("```", 1)[0].strip()
            elif "```" in content and "```" in content.split("```", 1)[1]:
                content = content.split("```", 1)[1].split("```", 1)[0].strip()
                
            result = json.loads(content)
            return result
        except json.JSONDecodeError as e:
            # If not valid JSON, return the raw content
            print(f"JSON parsing error in symptom analysis: {str(e)}")
            return {"error": "Could not parse differential diagnosis JSON", "raw_content": content}
            
    except Exception as e:
        print(f"Gemini API error in symptom analysis: {str(e)}")
        return {"error": f"Error generating differential diagnosis: {str(e)}"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to Healthcare Drug Interaction Analyzer API"}

@app.post("/api/analyze-drugs")
async def analyze_drugs(request: DrugAnalysisRequest):
    drug_infos = []
    basic_conflicts = []
    
    async with httpx.AsyncClient() as client:
        for medication in request.medications:
            try:
                # Query FDA API with API key
                response = await client.get(
                    f"https://api.fda.gov/drug/label.json",
                    params={
                        "search": f'openfda.brand_name:"{medication}"',
                        "api_key": FDA_API_KEY
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("results"):
                    drug_info = data["results"][0]
                    openfda = drug_info.get("openfda", {})
                    
                    # Handle case where generic_name is not found
                    generic_name = None
                    if openfda.get("generic_name") and len(openfda.get("generic_name")) > 0:
                        generic_name = openfda.get("generic_name")[0]
                    
                    drug_infos.append(DrugInfo(
                        brand_name=medication,
                        generic_name=generic_name,
                        warnings=drug_info.get("warnings", []),
                        contraindications=drug_info.get("contraindications", []),
                        adverse_reactions=drug_info.get("adverse_reactions", []),
                        drug_interactions=drug_info.get("drug_interactions", []),
                        indications_and_usage=drug_info.get("indications_and_usage", [])
                    ))
                else:
                    # Add a placeholder for drugs not found in the FDA database
                    drug_infos.append(DrugInfo(
                        brand_name=medication,
                        generic_name=None,
                        warnings=["No FDA data available for this medication"],
                        contraindications=[],
                        adverse_reactions=[],
                        drug_interactions=[],
                        indications_and_usage=[]
                    ))
            except Exception as e:
                print(f"Error fetching data for {medication}: {str(e)}")
                # Add a placeholder with error info instead of raising exception
                drug_infos.append(DrugInfo(
                    brand_name=medication,
                    generic_name=None,
                    warnings=[f"Error retrieving information: {str(e)}"],
                    contraindications=[],
                    adverse_reactions=[],
                    drug_interactions=[],
                    indications_and_usage=[]
                ))
    
    # Basic conflict analysis - wrap with try/except to handle any errors
    try:
        for i, drug1 in enumerate(drug_infos):
            for drug2 in drug_infos[i+1:]:
                # Only check for explicit drug interactions if generic names exist
                if drug1.generic_name and drug2.generic_name:
                    for interaction in drug1.drug_interactions:
                        if drug2.generic_name.lower() in interaction.lower():
                            basic_conflicts.append({
                                "drug1": drug1.brand_name,
                                "drug2": drug2.brand_name,
                                "type": "explicit_interaction",
                                "details": [interaction]
                            })
                    
                    for interaction in drug2.drug_interactions:
                        if drug1.generic_name.lower() in interaction.lower():
                            basic_conflicts.append({
                                "drug1": drug1.brand_name,
                                "drug2": drug2.brand_name,
                                "type": "explicit_interaction",
                                "details": [interaction]
                            })
                
                # Check for overlapping contraindications
                common_contraindications = set(drug1.contraindications) & set(drug2.contraindications)
                if common_contraindications:
                    basic_conflicts.append({
                        "drug1": drug1.brand_name,
                        "drug2": drug2.brand_name,
                        "type": "contraindication",
                        "details": list(common_contraindications)
                    })
                
                # Check for overlapping warnings
                common_warnings = set(drug1.warnings) & set(drug2.warnings)
                if common_warnings:
                    basic_conflicts.append({
                        "drug1": drug1.brand_name,
                        "drug2": drug2.brand_name,
                        "type": "warning",
                        "details": list(common_warnings)
                    })
    except Exception as e:
        print(f"Error during basic conflict analysis: {str(e)}")
        # Don't stop execution, continue with Gemini analysis
    
    # Use Gemini for advanced analysis
    drug_data = []
    for drug in drug_infos:
        drug_data.append({
            "brand_name": drug.brand_name,
            "generic_name": drug.generic_name,
            "warnings": drug.warnings,
            "contraindications": drug.contraindications,
            "adverse_reactions": drug.adverse_reactions,
            "drug_interactions": drug.drug_interactions
        })
    
    prompt = f"""
    I need you to analyze these medications for potential interactions, contradictions with the diagnosis, and additional warnings.
    
    Diagnosis: {request.diagnosis}
    Symptoms: {', '.join(request.symptoms)}
    
    Here is the drug information:
    {json.dumps(drug_data, indent=2)}
    
    Based on this information, please:
    1. Identify any potential advanced drug conflicts that might not be explicitly stated
    2. Determine if any of the medications contradict the diagnosis
    3. Provide any additional warnings specific to these medications combined with the symptoms
    
    Your response must be a valid JSON object with this exact structure:
    {{
        "advanced_conflicts": [
            {{
                "drugs": ["Drug1", "Drug2"],
                "type": "interaction type",
                "severity": "high/medium/low",
                "description": "detailed description of the interaction"
            }}
        ],
        "diagnosis_contradictions": [
            {{
                "drug": "Drug Name",
                "contradiction": "explanation of why this drug contradicts the diagnosis"
            }}
        ],
        "additional_warnings": [
            {{
                "warning": "description of additional warning",
                "drugs": ["Drug1", "Drug2"]
            }}
        ]
    }}
    
    If nothing is found for a category, use an empty array.
    IMPORTANT: Return ONLY the JSON object without any explanations, markdown formatting, or additional text.
    """
    
    try:
        advanced_analysis = await analyze_with_gemini(drug_infos, prompt)
    except Exception as e:
        print(f"Error during Gemini analysis: {str(e)}")
        advanced_analysis = {
            "error": f"Error analyzing drugs with AI: {str(e)}",
            "advanced_conflicts": [],
            "diagnosis_contradictions": [],
            "additional_warnings": []
        }
    
    return {
        "drug_infos": [drug.dict() for drug in drug_infos],
        "basic_conflicts": basic_conflicts,
        "advanced_analysis": advanced_analysis
    }

@app.post("/api/analyze-symptoms")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """
    Analyze symptoms and provide differential diagnoses
    """
    try:
        result = await generate_differential_diagnosis(request.symptoms, request.diagnosis)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

@app.get("/api/drug-info/{drug_name}")
async def get_drug_info(drug_name: str):
    try:
        async with httpx.AsyncClient() as client:
            # Query FDA API
            response = await client.get(
                f"https://api.fda.gov/drug/label.json",
                params={
                    "search": f'openfda.brand_name:"{drug_name}"',
                    "api_key": FDA_API_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("results"):
                raise HTTPException(status_code=404, detail=f"Drug not found: {drug_name}")
            
            drug_info = data["results"][0]
            openfda = drug_info.get("openfda", {})
            
            # Extract basic info
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
                "dosage_and_administration": drug_info.get("dosage_and_administration", [])
            }
            
            # Use Gemini for enhanced drug info
            prompt = f"""
            I need you to provide enhanced information about the following drug:
            
            Brand Name: {drug_name}
            Generic Name: {result.get('generic_name')}
            Warnings: {result.get('warnings')}
            Contraindications: {result.get('contraindications')}
            Adverse Reactions: {result.get('adverse_reactions')}
            Drug Interactions: {result.get('drug_interactions')}
            
            Based on this information, please provide:
            1. A concise summary of the most important information about this drug in layman's terms
            2. An explanation of the key warnings that people should be aware of
            3. Any special considerations patients should know about
            
            Return your analysis in this exact JSON format:
            {{
                "summary": "concise summary of the drug",
                "key_warnings_explanation": "explanation of warnings in simple terms",
                "special_considerations": "any special notes for patients"
            }}
            """
            
            # Create a model instance
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config={
                    "temperature": 0.1,
                    "max_output_tokens": 1000,
                },
            )
            
            # Generate text
            response = model.generate_content(prompt)
            
            if response:
                content = response.text
                try:
                    enhanced_info = json.loads(content)
                    result["enhanced_info"] = enhanced_info
                except:
                    result["enhanced_info"] = {"summary": content}
            
            return result
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drug info: {str(e)}")

@app.get("/api/search-drugs")
async def search_drugs(term: str, limit: int = 10):
    try:
        async with httpx.AsyncClient() as client:
            # Query FDA API
            response = await client.get(
                f"https://api.fda.gov/drug/label.json",
                params={
                    "search": f'openfda.brand_name:"{term}"~',
                    "limit": limit,
                    "api_key": FDA_API_KEY
                }
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
                    "product_type": openfda.get("product_type", [""])[0] if openfda.get("product_type") else ""
                })
            
            return {"results": results}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching drugs: {str(e)}")

@app.get("/api/drug-adverse-events")
async def get_drug_adverse_events(drug_name: str, limit: int = 10):
    """
    Get adverse events reported for a specific drug
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.fda.gov/drug/event.json",
                params={
                    "search": f'patient.drug.medicinalproduct:"{drug_name}"',
                    "limit": limit,
                    "api_key": FDA_API_KEY
                }
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
                    "outcome": report.get("patient", {}).get("patientoutcome", "Unknown")
                })
            
            return {"events": events}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching adverse events: {str(e)}") 