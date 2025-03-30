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
  FlatList,
  Modal
} from 'react-native';
import axios from 'axios';
import { DrugAnalysisResponse, DrugInfo, Conflict } from '../types';
import { API_URL } from '../config';

interface DrugSearchResult {
  brand_name: string;
  generic_name: string;
  manufacturer: string;
  product_type: string;
}

export default function DrugAnalysis() {
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [results, setResults] = useState<DrugAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedDrugDetails, setSelectedDrugDetails] = useState<any>(null);
  const [showDrugDetailsModal, setShowDrugDetailsModal] = useState(false);
  const [loadingDrugDetails, setLoadingDrugDetails] = useState(false);

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleDeleteMedication = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };

  const clearMedications = () => {
    setMedications([]);
  };

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
    if (!medications.length || !diagnosis || !symptoms.length) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/analyze-drugs`, {
        medications,
        diagnosis,
        symptoms,
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing drugs:', error);
      Alert.alert('Error', 'Error analyzing drugs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDrugs = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/api/search-drugs`, {
        params: { term: searchTerm, limit: 10 }
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching drugs:', error);
      Alert.alert('Error', 'Error searching drugs. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const addSelectedDrug = (drug: DrugSearchResult) => {
    if (!medications.includes(drug.brand_name)) {
      setMedications([...medications, drug.brand_name]);
    }
    setShowSearchModal(false);
  };

  const viewDrugDetails = async (drugName: string) => {
    setLoadingDrugDetails(true);
    try {
      const response = await axios.get(`${API_URL}/api/drug-info/${drugName}`);
      setSelectedDrugDetails(response.data);
      setShowDrugDetailsModal(true);
    } catch (error) {
      console.error('Error fetching drug details:', error);
      Alert.alert('Error', 'Unable to fetch drug details. Please try again.');
    } finally {
      setLoadingDrugDetails(false);
    }
  };

  const renderDrugInfo = (drug: DrugInfo) => (
    <View key={drug.brand_name} style={styles.drugCard}>
      <View style={styles.drugHeader}>
        <Text style={styles.drugName}>{drug.brand_name}</Text>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => viewDrugDetails(drug.brand_name)}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>

      {drug.generic_name && (
        <Text style={styles.genericName}>Generic: {drug.generic_name}</Text>
      )}

      {drug.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.warningTitle}>Warnings:</Text>
          {drug.warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}
      
      {drug.contraindications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.contraTitle}>Contraindications:</Text>
          {drug.contraindications.map((contra, idx) => (
            <Text key={idx} style={styles.contraText}>• {contra}</Text>
          ))}
        </View>
      )}

      {drug.drug_interactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.interactionTitle}>Drug Interactions:</Text>
          {drug.drug_interactions.map((interaction, idx) => (
            <Text key={idx} style={styles.interactionText}>• {interaction}</Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderConflict = (conflict: Conflict) => (
    <View key={`${conflict.drug1}-${conflict.drug2}-${conflict.type}`} style={styles.conflictCard}>
      <Text style={styles.conflictTitle}>
        {conflict.drug1} ↔ {conflict.drug2}
      </Text>
      <Text style={styles.conflictType}>Type: {conflict.type}</Text>
      {conflict.details.map((detail, idx) => (
        <Text key={idx} style={styles.conflictDetail}>• {detail}</Text>
      ))}
    </View>
  );

  const renderSearchResult = ({ item }: { item: DrugSearchResult }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => addSelectedDrug(item)}
    >
      <View>
        <Text style={styles.searchResultName}>{item.brand_name}</Text>
        <Text style={styles.searchResultGeneric}>{item.generic_name}</Text>
        <Text style={styles.searchResultManufacturer}>Manufacturer: {item.manufacturer}</Text>
      </View>
      <Text style={styles.searchResultAdd}>+ Add</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Medications</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newMedication}
              onChangeText={setNewMedication}
              placeholder="Enter medication name"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMedication}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Text style={styles.searchButtonText}>Search FDA Database</Text>
          </TouchableOpacity>
          
          {medications.map((med, index) => (
            <Text key={index} style={styles.listItem}>• {med}</Text>
          ))}
          
          {medications.length > 0 && (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={clearMedications}
            >
              <Text style={styles.dangerButtonText}>CLEAR ALL MEDICATIONS</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Diagnosis</Text>
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
            <Text style={styles.submitButtonText}>Analyze Drugs</Text>
          )}
        </TouchableOpacity>

        {results && (
          <View style={styles.resultsSection}>
            {results.basic_conflicts.length > 0 && (
              <View style={styles.conflictsSection}>
                <Text style={styles.sectionTitle}>Potential Conflicts Found</Text>
                {results.basic_conflicts.map(renderConflict)}
              </View>
            )}

            {results.advanced_analysis && (
              <View style={styles.advancedAnalysisSection}>
                <Text style={styles.sectionTitle}>AI-Powered Advanced Analysis</Text>
                
                {results.advanced_analysis.advanced_conflicts && results.advanced_analysis.advanced_conflicts.length > 0 && (
                  <View style={styles.aiAnalysisSection}>
                    <Text style={styles.aiSectionTitle}>Advanced Drug Interactions</Text>
                    {results.advanced_analysis.advanced_conflicts.map((conflict, index) => (
                      <View key={index} style={[styles.aiCard, 
                        conflict.severity === 'high' ? styles.highSeverityCard : 
                        conflict.severity === 'medium' ? styles.mediumSeverityCard : 
                        styles.lowSeverityCard]}>
                        <View style={styles.severityBadgeContainer}>
                          <Text style={styles.drugInteractionText}>
                            {conflict.drugs.join(' + ')}
                          </Text>
                          <View style={[styles.severityBadge, 
                            conflict.severity === 'high' ? styles.highSeverityBadge : 
                            conflict.severity === 'medium' ? styles.mediumSeverityBadge : 
                            styles.lowSeverityBadge]}>
                            <Text style={styles.severityText}>{conflict.severity}</Text>
                          </View>
                        </View>
                        <Text style={styles.interactionTypeText}>{conflict.type}</Text>
                        <Text style={styles.interactionDescription}>{conflict.description}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {results.advanced_analysis && results.advanced_analysis.diagnosis_contradictions && results.advanced_analysis.diagnosis_contradictions.length > 0 && (
                  <View style={styles.aiAnalysisSection}>
                    <Text style={styles.aiSectionTitle}>Potential Contradictions with Diagnosis</Text>
                    {results.advanced_analysis.diagnosis_contradictions.map((item, index) => (
                      <View key={index} style={styles.aiCard}>
                        <Text style={styles.contraDrugName}>{item.drug}</Text>
                        <Text style={styles.contraDescription}>{item.contradiction}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {results.advanced_analysis && results.advanced_analysis.additional_warnings && results.advanced_analysis.additional_warnings.length > 0 && (
                  <View style={styles.aiAnalysisSection}>
                    <Text style={styles.aiSectionTitle}>Additional Warnings</Text>
                    {results.advanced_analysis.additional_warnings.map((warning, index) => (
                      <View key={index} style={styles.aiCard}>
                        <Text style={styles.warningText}>{warning.warning}</Text>
                        {warning.drugs.length > 0 && (
                          <Text style={styles.warningDrugsText}>
                            Relevant medications: {warning.drugs.join(', ')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                
                {results.advanced_analysis && results.advanced_analysis.analysis && (
                  <View style={styles.aiAnalysisSection}>
                    <Text style={styles.aiSectionTitle}>Analysis</Text>
                    <View style={styles.aiCard}>
                      <Text style={styles.analysisText}>{results.advanced_analysis.analysis}</Text>
                    </View>
                  </View>
                )}
                
                {results.advanced_analysis && results.advanced_analysis.error && (
                  <View style={styles.aiAnalysisSection}>
                    <Text style={styles.aiSectionTitle}>Analysis Error</Text>
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>{results.advanced_analysis.error}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.drugsSection}>
              <Text style={styles.sectionTitle}>Drug Information</Text>
              {results.drug_infos.map(renderDrugInfo)}
            </View>
          </View>
        )}
      </View>

      {/* Drug Search Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showSearchModal}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Medications</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Enter drug name"
            />
            <TouchableOpacity
              style={styles.searchActionButton}
              onPress={handleSearchDrugs}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.searchActionButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.brand_name}
              style={styles.searchResultsList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {isSearching ? 'Searching...' : 'No results found. Try searching for a medication.'}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Drug Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showDrugDetailsModal}
        onRequestClose={() => setShowDrugDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Drug Details</Text>
            <TouchableOpacity onPress={() => setShowDrugDetailsModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          {loadingDrugDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading drug details...</Text>
            </View>
          ) : selectedDrugDetails ? (
            <ScrollView style={styles.detailsScrollView}>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>{selectedDrugDetails.brand_name}</Text>
                
                {selectedDrugDetails.generic_name && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Generic Name:</Text>
                    <Text style={styles.detailsText}>{selectedDrugDetails.generic_name}</Text>
                  </View>
                )}
                
                {selectedDrugDetails.manufacturer && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Manufacturer:</Text>
                    <Text style={styles.detailsText}>{selectedDrugDetails.manufacturer}</Text>
                  </View>
                )}
                
                {selectedDrugDetails.route && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Route of Administration:</Text>
                    <Text style={styles.detailsText}>{selectedDrugDetails.route}</Text>
                  </View>
                )}
                
                {selectedDrugDetails.indications_and_usage?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Indications & Usage:</Text>
                    {selectedDrugDetails.indications_and_usage.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.detailsText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.boxed_warnings?.length > 0 && (
                  <View style={styles.warningSection}>
                    <Text style={styles.warningLabel}>Boxed Warnings:</Text>
                    {selectedDrugDetails.boxed_warnings.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.warningText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.warnings?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.warningLabel}>Warnings:</Text>
                    {selectedDrugDetails.warnings.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.warningText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.contraindications?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.contraindicationLabel}>Contraindications:</Text>
                    {selectedDrugDetails.contraindications.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.contraindicationText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.drug_interactions?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.interactionLabel}>Drug Interactions:</Text>
                    {selectedDrugDetails.drug_interactions.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.interactionText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.adverse_reactions?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Adverse Reactions:</Text>
                    {selectedDrugDetails.adverse_reactions.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.detailsText}>• {item}</Text>
                    ))}
                  </View>
                )}
                
                {selectedDrugDetails.dosage_and_administration?.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Dosage & Administration:</Text>
                    {selectedDrugDetails.dosage_and_administration.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.detailsText}>• {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No drug details available</Text>
            </View>
          )}
        </View>
      </Modal>
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
  searchButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 14,
    color: '#0369a1',
    marginRight: 6,
  },
  pillDeleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillDeleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  conflictsSection: {
    marginBottom: 24,
  },
  conflictCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  conflictType: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 8,
  },
  conflictDetail: {
    fontSize: 14,
    color: '#991b1b',
    marginLeft: 8,
    marginBottom: 4,
  },
  drugsSection: {
    marginBottom: 24,
  },
  drugCard: {
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
  drugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drugName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  genericName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  detailsButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  detailsButtonText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    marginBottom: 4,
  },
  contraTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  contraText: {
    fontSize: 14,
    color: '#991b1b',
    marginLeft: 8,
    marginBottom: 4,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  interactionText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 8,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2563eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchActionButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchActionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.84,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchResultGeneric: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  searchResultManufacturer: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  searchResultAdd: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 12,
  },
  detailsScrollView: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginBottom: 4,
  },
  warningSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  warningLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  contraindicationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  contraindicationText: {
    fontSize: 14,
    color: '#991b1b',
    marginLeft: 8,
    marginBottom: 4,
  },
  interactionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  advancedAnalysisSection: {
    marginBottom: 24,
  },
  aiAnalysisSection: {
    marginBottom: 16,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  aiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.84,
    elevation: 2,
  },
  highSeverityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  mediumSeverityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
  },
  lowSeverityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
  },
  severityBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  highSeverityBadge: {
    backgroundColor: '#fee2e2',
  },
  mediumSeverityBadge: {
    backgroundColor: '#ffedd5',
  },
  lowSeverityBadge: {
    backgroundColor: '#fef9c3',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f1d1d',
  },
  drugInteractionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  interactionTypeText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4b5563',
    marginBottom: 4,
  },
  interactionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contraDrugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: 4,
  },
  contraDescription: {
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  warningDrugsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#92400e',
    marginTop: 4,
  },
  analysisText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
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