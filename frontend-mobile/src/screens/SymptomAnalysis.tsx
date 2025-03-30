import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { AnalysisResult, AlternativeDiagnosis } from '../types';
import { API_URL } from '../config';

export default function SymptomAnalysis() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleDeleteSymptom = (index: number) => {
    const updatedSymptoms = [...symptoms];
    updatedSymptoms.splice(index, 1);
    setSymptoms(updatedSymptoms);
  };

  const clearSymptoms = () => {
    setSymptoms([]);
  };

  const handleSubmit = async () => {
    if (!symptoms.length || !diagnosis) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/analyze-symptoms`, {
        symptoms,
        diagnosis,
        medications: [], // Empty array as we're only analyzing symptoms
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      Alert.alert('Error', 'Error analyzing symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAlternative = (alt: AlternativeDiagnosis) => (
    <View key={alt.condition} style={styles.alternativeCard}>
      <View style={styles.alternativeHeader}>
        <Text style={styles.alternativeTitle}>{alt.condition}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {Math.round(alt.similarity_score * 100)}% match
          </Text>
        </View>
      </View>
      <View style={styles.matchingSection}>
        <Text style={styles.matchingTitle}>Matching Symptoms:</Text>
        {alt.matching_symptoms.map((symptom: string, idx: number) => (
          <Text key={idx} style={styles.matchingSymptom}>• {symptom}</Text>
        ))}
      </View>
      {alt.explanation && (
        <View style={styles.explanationSection}>
          <Text style={styles.explanationTitle}>Explanation:</Text>
          <Text style={styles.explanationText}>{alt.explanation}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
          
          {symptoms.length > 0 && (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={clearSymptoms}
            >
              <Text style={styles.dangerButtonText}>CLEAR ALL SYMPTOMS</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Analyze Symptoms</Text>
          )}
        </TouchableOpacity>

        {results && (
          <View style={styles.resultsSection}>
            <View style={styles.currentDiagnosisSection}>
              <Text style={styles.sectionTitle}>Current Diagnosis</Text>
              <Text style={styles.diagnosisText}>{results.current_diagnosis}</Text>
            </View>

            <View style={styles.symptomsSection}>
              <Text style={styles.sectionTitle}>Reported Symptoms</Text>
              {results.symptoms.map((symptom, index) => (
                <Text key={index} style={styles.symptomText}>• {symptom}</Text>
              ))}
            </View>

            <View style={styles.alternativesSection}>
              <Text style={styles.sectionTitle}>AI-Powered Differential Diagnosis</Text>
              {results.analysis && results.analysis.alternatives.length > 0 ? (
                results.analysis.alternatives.map((alt) => renderAlternative(alt))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No alternative diagnoses found</Text>
                </View>
              )}
            </View>
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
  inputSection: {
    marginBottom: 20,
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  medItemList: {
    marginTop: 8,
    marginBottom: 5,
  },
  medItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  medItemBullet: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medItemBulletText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  medItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1e40af',
    marginLeft: 5,
  },
  medDeleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  medDeleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  currentDiagnosisSection: {
    marginBottom: 24,
  },
  diagnosisText: {
    fontSize: 18,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  symptomsSection: {
    marginBottom: 24,
  },
  symptomText: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 8,
    marginBottom: 8,
  },
  alternativesSection: {
    marginBottom: 24,
  },
  alternativeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativeTitle: {
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchingSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  matchingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
  },
  matchingSymptom: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginBottom: 4,
  },
  explanationSection: {
    marginTop: 4,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  bigRedButton: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  bigButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  medItem: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  medText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: '#dc2626',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    padding: 15,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 8,
    marginBottom: 4,
  },
}); 