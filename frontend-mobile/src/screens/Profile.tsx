import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  DrugAnalysisResponse, 
  DrugSearchResult, 
  AlternativeDiagnosis,
  AdvancedConflict 
} from '../types';

export default function Profile() {
  // State for user information
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  
  // State for medication inputs
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  
  // State for symptom inputs
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  
  // Analysis results
  const [drugResults, setDrugResults] = useState<DrugAnalysisResponse | null>(null);
  const [symptomResults, setSymptomResults] = useState<any | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inputs' | 'results'>('inputs');

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleAnalyze = async () => {
    if (!medications.length || !diagnosis || !symptoms.length) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Drug analysis
      const drugResponse = await axios.post(`${API_URL}/api/analyze-drugs`, {
        medications,
        diagnosis,
        symptoms,
      });
      console.log('Drug analysis response:', JSON.stringify(drugResponse.data, null, 2));
      setDrugResults(drugResponse.data);

      // Symptom analysis
      const symptomResponse = await axios.post(`${API_URL}/api/analyze-symptoms`, {
        diagnosis,
        symptoms,
      });
      console.log('Symptom analysis response:', JSON.stringify(symptomResponse.data, null, 2));
      setSymptomResults(symptomResponse.data);
      
      // Switch to results tab
      setActiveTab('results');
    } catch (error) {
      console.error('Error analyzing health data:', error);
      Alert.alert('Error', 'Something went wrong with the analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDrugInfo = (drug: any, index: number) => (
    <View key={index} style={styles.infoCard}>
      <Text style={styles.drugName}>{drug.brand_name}</Text>
      {drug.generic_name && (
        <Text style={styles.genericName}>Generic: {drug.generic_name}</Text>
      )}
      {drug.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warnings:</Text>
          {drug.warnings.map((warning: string, idx: number) => (
            <Text key={idx} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderAlternative = (alt: AlternativeDiagnosis, index: number) => (
    <View key={index} style={styles.alternativeCard}>
      <View style={styles.altHeader}>
        <Text style={styles.altTitle}>{alt.condition}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {Math.round(alt.similarity_score * 100)}% match
          </Text>
        </View>
      </View>
      <Text style={styles.matchingSymptoms}>
        Matching symptoms: {alt.matching_symptoms.join(', ')}
      </Text>
      {alt.explanation && (
        <Text style={styles.explanation}>{alt.explanation}</Text>
      )}
    </View>
  );

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return styles.highSeverity;
      case 'medium':
        return styles.mediumSeverity;
      case 'low':
        return styles.lowSeverity;
      default:
        return styles.lowSeverity;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Health Profile powered by Gemini AI</Text>
        
        <View style={styles.tabButtons}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'inputs' && styles.activeTab]}
            onPress={() => setActiveTab('inputs')}
          >
            <Text style={styles.tabText}>Inputs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
            disabled={!drugResults && !symptomResults}
          >
            <Text style={styles.tabText}>Results</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'inputs' ? (
          <View style={styles.inputsContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Your Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Current Diagnosis</Text>
              <TextInput
                style={styles.input}
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Enter current diagnosis"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Medications</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={newMedication}
                  onChangeText={setNewMedication}
                  placeholder="Enter medication"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddMedication}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {medications.map((medication, index) => (
                <Text key={index} style={styles.listItem}>• {medication}</Text>
              ))}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Symptoms</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={newSymptom}
                  onChangeText={setNewSymptom}
                  placeholder="Enter symptom"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSymptom}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {symptoms.map((symptom, index) => (
                <Text key={index} style={styles.listItem}>• {symptom}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Analyze Health Data</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {drugResults && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>Medication Analysis</Text>
                
                {drugResults.basic_conflicts && drugResults.basic_conflicts.length > 0 && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Potential Drug Conflicts</Text>
                    {drugResults.basic_conflicts.map((conflict, index) => (
                      <View key={index} style={styles.conflictCard}>
                        <Text style={styles.conflictTitle}>
                          {conflict.drug1} ↔ {conflict.drug2}
                        </Text>
                        <Text style={styles.conflictType}>Type: {conflict.type}</Text>
                        {conflict.details.map((detail, idx) => (
                          <Text key={idx} style={styles.detailText}>• {detail}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
                
                {drugResults.advanced_analysis && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>AI Analysis</Text>
                    
                    {drugResults.advanced_analysis.advanced_conflicts && 
                     drugResults.advanced_analysis.advanced_conflicts.length > 0 ? (
                      drugResults.advanced_analysis.advanced_conflicts.map((conflict, index) => (
                        <View key={index} style={styles.advancedCard}>
                          <View style={styles.severityBadgeContainer}>
                            <View style={[styles.severityBadge, getSeverityStyle(conflict.severity)]}>
                              <Text style={styles.severityText}>{conflict.severity}</Text>
                            </View>
                          </View>
                          <Text style={styles.advancedTitle}>{conflict.type}</Text>
                          <Text style={styles.advancedDescription}>{conflict.description}</Text>
                          <Text style={styles.drugsInvolved}>
                            Medications: {conflict.drugs.join(', ')}
                          </Text>
                        </View>
                      ))
                    ) : drugResults.advanced_analysis.analysis ? (
                      <View style={styles.advancedCard}>
                        <Text style={styles.advancedDescription}>{drugResults.advanced_analysis.analysis}</Text>
                      </View>
                    ) : drugResults.advanced_analysis.error ? (
                      <View style={styles.advancedCard}>
                        <Text style={[styles.advancedDescription, {color: '#b91c1c'}]}>
                          Error: {drugResults.advanced_analysis.error}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.advancedCard}>
                        <Text style={styles.advancedDescription}>No significant interactions found</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Drug Information</Text>
                  {drugResults.drug_infos && drugResults.drug_infos.length > 0 ? (
                    drugResults.drug_infos.map((drug, index) => renderDrugInfo(drug, index))
                  ) : (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>No medication information available</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {symptomResults && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>Symptom Analysis</Text>
                
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Your Information</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>Diagnosis: {diagnosis}</Text>
                    <Text style={styles.infoText}>
                      Reported Symptoms: {symptoms.join(', ')}
                    </Text>
                  </View>
                </View>
                
                {symptomResults.alternatives && symptomResults.alternatives.length > 0 ? (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Alternative Diagnoses</Text>
                    {symptomResults.alternatives.map(
                      (alt: AlternativeDiagnosis, index: number) => renderAlternative(alt, index)
                    )}
                  </View>
                ) : symptomResults.analysis && symptomResults.analysis.alternatives && 
                   symptomResults.analysis.alternatives.length > 0 ? (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Alternative Diagnoses</Text>
                    {symptomResults.analysis.alternatives.map(
                      (alt: AlternativeDiagnosis, index: number) => renderAlternative(alt, index)
                    )}
                  </View>
                ) : symptomResults.error ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.warningText}>Error: {symptomResults.error}</Text>
                    {symptomResults.raw_content && (
                      <Text style={styles.infoText}>{symptomResults.raw_content}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>No alternative diagnoses found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  inputsContainer: {
    marginBottom: 20,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  listItem: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  drugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  genericName: {
    color: '#6b7280',
    marginBottom: 8,
  },
  section: {
    marginTop: 8,
  },
  warningText: {
    color: '#b91c1c',
    marginBottom: 4,
  },
  conflictCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  conflictType: {
    color: '#b91c1c',
    fontWeight: '500',
    marginVertical: 4,
  },
  detailText: {
    color: '#7f1d1d',
  },
  advancedCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  severityBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  highSeverity: {
    backgroundColor: '#fee2e2',
  },
  mediumSeverity: {
    backgroundColor: '#fef3c7',
  },
  lowSeverity: {
    backgroundColor: '#d1fae5',
  },
  severityText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  advancedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  advancedDescription: {
    color: '#4b5563',
    marginVertical: 4,
  },
  drugsInvolved: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  alternativeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  altHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  altTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  scoreContainer: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scoreText: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontSize: 12,
  },
  matchingSymptoms: {
    color: '#4b5563',
    marginBottom: 4,
  },
  explanation: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  infoText: {
    color: '#4b5563',
    marginBottom: 4,
  },
}); 