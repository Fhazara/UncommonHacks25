export interface DrugInfo {
  brand_name: string;
  generic_name?: string;
  warnings: string[];
  contraindications: string[];
  adverse_reactions: string[];
  drug_interactions: string[];
  indications_and_usage: string[];
}

export interface Conflict {
  drug1: string;
  drug2: string;
  type: string;
  details: string[];
}

export interface AlternativeDiagnosis {
  condition: string;
  similarity_score: number;
  matching_symptoms: string[];
  explanation?: string;
}

export interface AnalysisResult {
  current_diagnosis: string;
  symptoms: string[];
  analysis: {
    alternatives: AlternativeDiagnosis[];
  };
}

export interface AdvancedConflict {
  drugs: string[];
  type: string;
  severity: string;
  description: string;
}

export interface DiagnosisContradiction {
  drug: string;
  contradiction: string;
}

export interface AdditionalWarning {
  warning: string;
  drugs: string[];
}

export interface ChatGPTAnalysis {
  advanced_conflicts?: AdvancedConflict[];
  diagnosis_contradictions?: DiagnosisContradiction[];
  additional_warnings?: AdditionalWarning[];
  analysis?: string;
  error?: string;
}

export interface DrugAnalysisResponse {
  drug_infos: DrugInfo[];
  basic_conflicts: Conflict[];
  advanced_analysis: ChatGPTAnalysis;
}

export interface DrugSearchResult {
  brand_name: string;
  generic_name: string;
  manufacturer: string;
  product_type: string;
}

export interface EnhancedDrugInfo {
  summary: string;
  key_warnings_explanation: string;
  special_considerations: string;
}

export interface DrugDetailInfo {
  brand_name: string;
  generic_name?: string;
  manufacturer?: string;
  product_type?: string;
  route?: string;
  warnings: string[];
  contraindications: string[];
  adverse_reactions: string[];
  drug_interactions: string[];
  boxed_warnings: string[];
  indications_and_usage: string[];
  dosage_and_administration: string[];
  enhanced_info?: EnhancedDrugInfo;
} 