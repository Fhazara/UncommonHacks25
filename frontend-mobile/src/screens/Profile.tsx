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
  const [activeTab, setActiveTab] = useState<'inputs' | 'results' | 'selfHelp'>('inputs');

  // Add new state for modal and email
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

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

  // Function to handle sending email
  const handleSendEmail = async () => {
    if (!recipientEmail.trim() || !emailMessage.trim()) {
      Alert.alert('Error', 'Please provide an email address and message');
      return;
    }
    
    setIsSendingEmail(true);
    try {
      console.log(`Sending email to ${API_URL}/api/send-email`);
      const emailResponse = await axios.post(`${API_URL}/api/send-email`, {
        to: recipientEmail,
        subject: 'Medical Information from MediScan',
        message: emailMessage,
      });
      
      console.log('Email response:', emailResponse.data);
      
      if (emailResponse.data.success) {
        Alert.alert('Success', 'Complete health package with infection prevention guide sent successfully');
        setIsEmailModalVisible(false);
        setRecipientEmail('');
        setEmailMessage('');
      } else {
        Alert.alert('Error', emailResponse.data.message || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Something went wrong while sending the email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Function to prepare email with current analysis and infection prevention information
  const prepareEmailContent = () => {
    let content = `Medical Analysis from MediScan:\n\n`;
    
    if (name) {
      content += `Patient: ${name}\n`;
    }
    
    if (diagnosis) {
      content += `Current Diagnosis: ${diagnosis}\n`;
    }
    
    if (symptoms.length > 0) {
      content += `Reported Symptoms: ${symptoms.join(', ')}\n\n`;
    }
    
    if (medications.length > 0) {
      content += `Current Medications: ${medications.join(', ')}\n\n`;
    }
    
    if (drugResults && drugResults.advanced_analysis) {
      content += `Medication Analysis:\n`;
      
      if (drugResults.advanced_analysis.advanced_conflicts && drugResults.advanced_analysis.advanced_conflicts.length > 0) {
        content += `Potential Drug Interactions:\n`;
        drugResults.advanced_analysis.advanced_conflicts.forEach((conflict: AdvancedConflict) => {
          content += `- ${conflict.drugs.join(' + ')}: ${conflict.description} (Severity: ${conflict.severity})\n`;
        });
      } else {
        content += `No significant drug interactions found.\n`;
      }
    }
    
    if (symptomResults && symptomResults.alternatives && symptomResults.alternatives.length > 0) {
      content += `\nAlternative Conditions to Consider:\n`;
      symptomResults.alternatives.slice(0, 3).forEach((alt: AlternativeDiagnosis) => {
        content += `- ${alt.condition} (${Math.round(alt.similarity_score * 100)}% match): ${alt.explanation}\n`;
      });
    }
    
    content += `\n\n===== HOSPITAL INFECTION PREVENTION GUIDE =====\n\n`;
    
    // 1. Superbug Infections
    content += `1. Superbug Infections (MRSA/VRE/CRKP)\nPrevention Tips:\n\n`;
    content += `Always wash your hands with warm, soapy water or use antimicrobial hand gel before coming in contact with the patient.\n\n`;
    content += `Remind healthcare providers (nurses, doctors) to wash their hands if they forget.\n\n`;
    content += `Ensure your loved one washes hands—especially under nails—after using the bathroom and before eating.\n\n`;
    content += `Use alcohol wipes to clean surfaces that the patient or visitors touch (cell phones, doorknobs, call buttons, tray tables, bedside tables, chairs, wheelchair arms/backs, telephone, faucets, bed rails, inhalers, grab rails, IV pole, TV remote, toilet handle).\n\n`;
    content += `Key Points:\n\n`;
    content += `Superbugs thrive on skin, fabrics, and hard surfaces.\n\n`;
    content += `One in every 25 patients may pick up a superbug infection in the hospital.\n\n`;
    content += `Prevention is largely in thorough hand washing and surface disinfection.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you notice that proper hand hygiene is not being followed or surfaces remain unclean.\n\n`;

    // 2. C. diff Infections
    content += `2. C. diff (Clostridioides difficile) Infections\nPrevention Tips:\n\n`;
    content += `Use bleach wipes—not alcohol wipes—to clean surfaces, as C. diff spores are resistant to alcohol.\n\n`;
    content += `If your loved one is at risk (e.g., recent antibiotics, nursing home resident), make sure it's noted in their medical record.\n\n`;
    content += `Remind nurses to remove or replace urinary catheters when no longer necessary.\n\n`;
    content += `Encourage frequent hand washing with warm, soapy water (especially after using the bathroom).\n\n`;
    content += `Clean the patient's environment rigorously with bleach wipes.\n\n`;
    content += `Key Points:\n\n`;
    content += `C. diff bacteria can thrive on skin, fabric, and hard surfaces.\n\n`;
    content += `Bleach wipes are essential since alcohol wipes won't kill C. diff.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If the patient's environment isn't being properly cleaned, or if the Foley catheter isn't removed in a timely manner.\n\n`;

    // 3. Sepsis
    content += `3. Sepsis (Bloodstream Infections)\nPrevention Tips:\n\n`;
    content += `Ensure that central lines (IVs) are inserted using a full sterile technique and maintained with 100% germ-free practices.\n\n`;
    content += `Ask if a central line bundle and checklist are being used during IV insertion.\n\n`;
    content += `Monitor that any skin puncture sites remain covered and clean.\n\n`;
    content += `Watch for signs of infection around the central line insertion site.\n\n`;
    content += `Key Points:\n\n`;
    content += `Sepsis can develop from contaminated central lines.\n\n`;
    content += `100% sterile techniques during insertion and maintenance are critical.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you suspect any breaches in sterile procedures during IV insertion or if the insertion site appears red, swollen, or warm.\n\n`;

    // 4. Falls and Fractures
    content += `4. Falls and Fractures\nPrevention Tips:\n\n`;
    content += `Alert nurses if you're concerned about fall risks.\n\n`;
    content += `Request a bed alarm and a room close to the nurses' station.\n\n`;
    content += `Identify and remove potential tripping hazards in the room.\n\n`;
    content += `Ask for non-skid socks, bed rails, and mobility aids (cane, walker).\n\n`;
    content += `Provide physical support when the patient gets out of bed.\n\n`;
    content += `Key Points:\n\n`;
    content += `Falls can occur even with alert patients and can lead to fractures.\n\n`;
    content += `Prevention involves both environmental adjustments and active assistance.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you observe hazards or if the patient attempts to get up without assistance.\n\n`;

    // 5. Blood Clots
    content += `5. Blood Clots (Pulmonary Embolism/PE)\nPrevention Tips:\n\n`;
    content += `Encourage early and frequent walking as soon as it is safe.\n\n`;
    content += `Ask for elastic stockings, pulsing boots, or arm bands.\n\n`;
    content += `Discuss the need for blood thinner medications with the doctor.\n\n`;
    content += `Monitor for signs of blood clots even after discharge.\n\n`;
    content += `Review and support a healthy diet that discourages clot formation.\n\n`;
    content += `Key Points:\n\n`;
    content += `Hospitalized patients are at higher risk due to immobility.\n\n`;
    content += `Special equipment and possibly medications help reduce the risk.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you see signs of swelling, pain, or discoloration in the limbs or other indications of clot formation.\n\n`;

    // 6. Medication Mistakes
    content += `6. Medication Mistakes\nPrevention Tips:\n\n`;
    content += `Verify that your loved one's allergies and previous adverse drug reactions are clearly documented.\n\n`;
    content += `Ask nurses before medication administration:\n`;
    content += `What is the medication?\n`;
    content += `What is it for?\n`;
    content += `What is the dose?\n`;
    content += `Who prescribed it?\n\n`;
    content += `Read labels (especially on IV bags) and confirm details.\n\n`;
    content += `Keep a record of all medications given (including timing and dosages).\n\n`;
    content += `Speak up immediately if something seems off—wrong patient, wrong medicine, wrong time, wrong dose, or wrong administration.\n\n`;
    content += `Key Points:\n\n`;
    content += `Medication errors can be dangerous, even fatal.\n\n`;
    content += `Double-checking details and communicating concerns are crucial for safety.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `Immediately if you notice any potential error or discrepancy in medication administration.\n\n`;

    // 7. UTIs
    content += `7. Urinary Tract Infections (UTIs)\nPrevention Tips:\n\n`;
    content += `Ask daily if the urinary catheter (Foley catheter) can be removed.\n\n`;
    content += `Confirm the doctor's written order for catheter removal.\n\n`;
    content += `Inquire about the cleaning schedule for the catheter.\n\n`;
    content += `Ensure the catheter tubing remains free of kinks and tangles.\n\n`;
    content += `Keep the catheter bag below the level of the patient's stomach.\n\n`;
    content += `Replace the catheter bag when full.\n\n`;
    content += `Key Points:\n\n`;
    content += `UTIs are common in hospitals, especially with prolonged catheter use.\n\n`;
    content += `Regular checks and proper catheter care help reduce infection risk.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If the catheter appears to be improperly maintained, or if you have concerns about its duration or cleanliness.\n\n`;

    // 8. Ventilator Pneumonia
    content += `8. Ventilator Pneumonia (VAP)\nPrevention Tips:\n\n`;
    content += `Ensure the patient's mattress is angled at 30–45 degrees to prevent fluid pooling.\n\n`;
    content += `Ask about the sterile procedures used when inserting the breathing tube.\n\n`;
    content += `Confirm daily assessments of the patient's ability to breathe without the ventilator.\n\n`;
    content += `Use positioning guides to keep the patient's head elevated.\n\n`;
    content += `Monitor for signs of bed sores and reposition the patient as necessary.\n\n`;
    content += `Check that oral hygiene protocols (using toothbrush, peroxide toothpaste, mouth rinse) are followed.\n\n`;
    content += `Key Points:\n\n`;
    content += `Ventilator-associated pneumonia is linked to improper positioning and contamination.\n\n`;
    content += `Elevating the patient's head and ensuring strict sterile practices are key.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you observe that the patient's head is not properly elevated or if there are signs of respiratory distress.\n\n`;

    // 9. Bed Sores
    content += `9. Bed Sores (Pressure Ulcers)\nPrevention Tips:\n\n`;
    content += `Reposition the patient at least every two hours.\n\n`;
    content += `Use alternating air pressure mattresses and moisture-absorbing pads.\n\n`;
    content += `Ensure foam cushions or padding are used on bony areas (ankles, knees, elbows, head, tailbone).\n\n`;
    content += `Change wet gowns or sheets promptly.\n\n`;
    content += `Use barrier creams for fragile skin areas.\n\n`;
    content += `Increase protein in the diet if approved by the doctor.\n\n`;
    content += `Regularly check the patient's skin for signs of pressure damage.\n\n`;
    content += `Key Points:\n\n`;
    content += `Bed sores are highly preventable with frequent repositioning and proper bedding.\n\n`;
    content += `They can lead to severe infections and complications if not addressed promptly.\n\n`;
    content += `When to Call a Nurse:\n\n`;
    content += `If you notice any signs of skin breakdown, persistent redness, or pain in bony areas.\n\n`;
    
    content += `This information is for reference only. Please consult a healthcare professional for medical advice.\n\n`;
    content += `©2024 MediScan - Empowering Patients With More Information`;
    
    setEmailMessage(content);
    setIsEmailModalVisible(true);
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
        <Text style={styles.title}>Empowering Patients With More Information</Text>
        
        <View style={styles.tabButtons}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'inputs' && styles.activeTab]}
            onPress={() => setActiveTab('inputs')}
          >
            <Text style={styles.tabText}>Medical Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
            disabled={!drugResults && !symptomResults}
          >
            <Text style={styles.tabText}>Medical Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'selfHelp' && styles.activeTab]}
            onPress={() => setActiveTab('selfHelp')}
          >
            <Text style={styles.tabText}>Self Help</Text>
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
                <Text style={styles.submitButtonText}>Generate Medical Analysis</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : activeTab === 'results' ? (
          <View style={styles.resultsContainer}>
            {drugResults && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>Medical Analysis - Medications</Text>
                
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
                    <Text style={styles.subsectionTitle}>Analysis</Text>
                    
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
                <Text style={styles.sectionTitle}>Medical Analysis - Symptoms</Text>
                
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Your Information</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>Diagnosis: {diagnosis}</Text>
                    <Text style={styles.infoText}>
                      Reported Symptoms: {symptoms.join(', ')}
                    </Text>
                  </View>
                </View>
                
                {/* Add Current Diagnosis Similarity Section */}
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Current Diagnosis Assessment</Text>
                  <View style={styles.alternativeCard}>
                    <View style={styles.altHeader}>
                      <Text style={styles.altTitle}>{diagnosis}</Text>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>
                          {symptomResults.diagnosis_similarity ? 
                            `${Math.round(symptomResults.diagnosis_similarity * 100)}% match` : 
                            'No match data'}
                        </Text>
                      </View>
                    </View>
                    {symptomResults.matching_symptoms && (
                      <Text style={styles.matchingSymptoms}>
                        Matching symptoms: {symptomResults.matching_symptoms.join(', ')}
                      </Text>
                    )}
                    {symptomResults.diagnosis_assessment && (
                      <Text style={styles.explanation}>{symptomResults.diagnosis_assessment}</Text>
                    )}
                    {!symptomResults.diagnosis_similarity && !symptomResults.diagnosis_assessment && (
                      <Text style={styles.explanation}>
                        No detailed assessment available for this diagnosis. Consider consulting a healthcare provider for a thorough evaluation.
                      </Text>
                    )}
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
        ) : (
          <View style={styles.selfHelpContainer}>
            <Text style={styles.sectionTitle}>Self Care Resources</Text>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Medication Management', 
                'Always take medications as prescribed. Set reminders to avoid missing doses. Keep a medication diary to track any side effects.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Medication Management</Text>
              <Text style={styles.selfHelpText}>Tips for taking medications safely and effectively</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Symptom Monitoring', 
                'Keep a daily log of your symptoms, noting any changes in severity or new symptoms. This information can help your healthcare provider adjust your treatment.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Symptom Monitoring</Text>
              <Text style={styles.selfHelpText}>How to track and manage your symptoms</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('When to Seek Help', 
                'Contact your healthcare provider immediately if you experience: severe side effects, worsening symptoms, or any new concerning symptoms.'
              )}
            >
              <Text style={styles.selfHelpTitle}>When to Seek Help</Text>
              <Text style={styles.selfHelpText}>Know when to contact your healthcare provider</Text>
            </TouchableOpacity>
            
            <Text style={[styles.sectionTitle, {marginTop: 20, marginBottom: 12}]}>Prevent Superbug Infections</Text>
            <Text style={styles.infoText}>Dangerous and difficult-to-fight infections such as MRSA, VRE, and staph are called "superbugs." The germs are invisible and they're everywhere in every hospital—even on clothing.</Text>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Hand Hygiene', 
                '• Always wash your hands with soap and warm water, or use alcohol gel or foam before touching your loved one.\n\n' +
                '• Wash hands whenever you enter or leave the room.\n\n' +
                '• Kindly remind visitors and others to wash their hands before touching your loved one.\n\n' +
                '• Help make sure your loved one washes their hands and uses a soft-bristled brush to gently clean under nails, especially after using the bathroom and before eating.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Hand Hygiene</Text>
              <Text style={styles.selfHelpText}>Proper handwashing techniques to prevent infections</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Surface Cleaning', 
                '• Use alcohol wipes to clean away germs from any surfaces your loved one and others may touch:\n' +
                '  - Cell phone, TV remote\n' +
                '  - Doorknobs, bed rails\n' +
                '  - Call buttons, room phone\n' +
                '  - Tray table (top, sides, drawer and underneath)\n' +
                '  - Bedside table, grab rails\n' +
                '  - Toilet handle, sink handles\n\n' +
                '• Be sure to clean again after every touch or contact by anyone.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Surface Cleaning</Text>
              <Text style={styles.selfHelpText}>How to keep surfaces germ-free</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Medical Equipment', 
                '• Make sure nurses and doctors use clean stethoscopes and thermometers.\n\n' +
                '• Ask for alcohol-based hand cleanser to put within easy reach for your loved one.\n\n' +
                '• Note: It\'s okay to ask for alcohol wipes and gel, and a nail brush. If you buy them yourself, choose well-known brands.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Medical Equipment</Text>
              <Text style={styles.selfHelpText}>Ensuring clean medical tools and supplies</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Warning Signs', 
                'GET A NURSE IF your loved one shows signs of or complains about:\n\n' +
                '• Oozing, pus, redness, or tenderness around surgery stitches\n' +
                '• Bumps or spots that look like boils, bug bites, or pimples\n' +
                '• Breaks in the skin or skin rash\n' +
                '• Chills, shivering, confusion\n' +
                '• Extreme pain, fast heartbeat\n' +
                '• Headache, diarrhea, nausea\n' +
                '• Fast breathing, body aches, cramps\n' +
                '• No appetite'
              )}
            >
              <Text style={styles.selfHelpTitle}>Warning Signs</Text>
              <Text style={styles.selfHelpText}>Know when to call for medical help</Text>
            </TouchableOpacity>
            
            <Text style={[styles.sectionTitle, {marginTop: 30, marginBottom: 12}]}>Hospital Infection Prevention</Text>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Superbug Infections (MRSA/VRE/CRKP)', 
                'Prevention Tips:\n\n' +
                '• Always wash your hands with warm, soapy water or use antimicrobial hand gel.\n\n' +
                '• Remind healthcare providers to wash their hands if they forget.\n\n' +
                '• Ensure your loved one washes hands—especially under nails—after using the bathroom and before eating.\n\n' +
                '• Use alcohol wipes to clean surfaces (cell phones, doorknobs, call buttons, tray tables, etc).\n\n' +
                'Key Points:\n\n' +
                '• Superbugs thrive on skin, fabrics, and hard surfaces.\n\n' +
                '• One in every 25 patients may pick up a superbug infection in the hospital.\n\n' +
                '• Prevention is largely in thorough hand washing and surface disinfection.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you notice that proper hand hygiene is not being followed or surfaces remain unclean.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Superbug Infections (MRSA/VRE/CRKP)</Text>
              <Text style={styles.selfHelpText}>Prevention tips for drug-resistant bacterial infections</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('C. diff Infections', 
                'Prevention Tips:\n\n' +
                '• Use bleach wipes—not alcohol wipes—to clean surfaces, as C. diff spores are resistant to alcohol.\n\n' +
                '• If your loved one is at risk (e.g., recent antibiotics, nursing home resident), make sure it\'s noted in their medical record.\n\n' +
                '• Remind nurses to remove or replace urinary catheters when no longer necessary.\n\n' +
                '• Encourage frequent hand washing with warm, soapy water.\n\n' +
                '• Clean the patient\'s environment rigorously with bleach wipes.\n\n' +
                'Key Points:\n\n' +
                '• C. diff bacteria can thrive on skin, fabric, and hard surfaces.\n\n' +
                '• Bleach wipes are essential since alcohol wipes won\'t kill C. diff.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If the patient\'s environment isn\'t being properly cleaned, or if the Foley catheter isn\'t removed in a timely manner.'
              )}
            >
              <Text style={styles.selfHelpTitle}>C. diff Infections</Text>
              <Text style={styles.selfHelpText}>Preventing Clostridioides difficile infections</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Sepsis (Bloodstream Infections)', 
                'Prevention Tips:\n\n' +
                '• Ensure that central lines (IVs) are inserted using a full sterile technique.\n\n' +
                '• Ask if a central line bundle and checklist are being used during IV insertion.\n\n' +
                '• Monitor that any skin puncture sites remain covered and clean.\n\n' +
                '• Watch for signs of infection around the central line insertion site.\n\n' +
                'Key Points:\n\n' +
                '• Sepsis can develop from contaminated central lines.\n\n' +
                '• 100% sterile techniques during insertion and maintenance are critical.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you suspect any breaches in sterile procedures during IV insertion or if the insertion site appears red, swollen, or warm.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Sepsis (Bloodstream Infections)</Text>
              <Text style={styles.selfHelpText}>Preventing life-threatening blood infections</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Falls and Fractures', 
                'Prevention Tips:\n\n' +
                '• Alert nurses if you\'re concerned about fall risks.\n\n' +
                '• Request a bed alarm and a room close to the nurses\' station.\n\n' +
                '• Identify and remove potential tripping hazards in the room.\n\n' +
                '• Ask for non-skid socks, bed rails, and mobility aids (cane, walker).\n\n' +
                '• Provide physical support when the patient gets out of bed.\n\n' +
                'Key Points:\n\n' +
                '• Falls can occur even with alert patients and can lead to fractures.\n\n' +
                '• Prevention involves both environmental adjustments and active assistance.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you observe hazards or if the patient attempts to get up without assistance.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Falls and Fractures</Text>
              <Text style={styles.selfHelpText}>Preventing falls in the hospital setting</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Blood Clots', 
                'Prevention Tips:\n\n' +
                '• Encourage early and frequent walking as soon as it is safe.\n\n' +
                '• Ask for elastic stockings, pulsing boots, or arm bands.\n\n' +
                '• Discuss the need for blood thinner medications with the doctor.\n\n' +
                '• Monitor for signs of blood clots even after discharge.\n\n' +
                '• Review and support a healthy diet that discourages clot formation.\n\n' +
                'Key Points:\n\n' +
                '• Hospitalized patients are at higher risk due to immobility.\n\n' +
                '• Special equipment and possibly medications help reduce the risk.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you see signs of swelling, pain, or discoloration in the limbs.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Blood Clots (Pulmonary Embolism/PE)</Text>
              <Text style={styles.selfHelpText}>Preventing dangerous blood clots during hospital stays</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Medication Mistakes', 
                'Prevention Tips:\n\n' +
                '• Verify that allergies and previous adverse drug reactions are clearly documented.\n\n' +
                '• Ask nurses before medication administration:\n   - What is the medication?\n   - What is it for?\n   - What is the dose?\n   - Who prescribed it?\n\n' +
                '• Read labels (especially on IV bags) and confirm details.\n\n' +
                '• Keep a record of all medications given (including timing and dosages).\n\n' +
                '• Speak up immediately if something seems off.\n\n' +
                'Key Points:\n\n' +
                '• Medication errors can be dangerous, even fatal.\n\n' +
                '• Double-checking details and communicating concerns are crucial for safety.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• Immediately if you notice any potential error or discrepancy in medication administration.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Medication Mistakes</Text>
              <Text style={styles.selfHelpText}>Preventing medication errors in healthcare settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Urinary Tract Infections', 
                'Prevention Tips:\n\n' +
                '• Ask daily if the urinary catheter (Foley catheter) can be removed.\n\n' +
                '• Confirm the doctor\'s written order for catheter removal.\n\n' +
                '• Inquire about the cleaning schedule for the catheter.\n\n' +
                '• Ensure the catheter tubing remains free of kinks and tangles.\n\n' +
                '• Keep the catheter bag below the level of the patient\'s stomach.\n\n' +
                '• Replace the catheter bag when full.\n\n' +
                'Key Points:\n\n' +
                '• UTIs are common in hospitals, especially with prolonged catheter use.\n\n' +
                '• Regular checks and proper catheter care help reduce infection risk.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If the catheter appears to be improperly maintained, or if you have concerns about its duration or cleanliness.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Urinary Tract Infections (UTIs)</Text>
              <Text style={styles.selfHelpText}>Preventing catheter-associated UTIs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Ventilator Pneumonia', 
                'Prevention Tips:\n\n' +
                '• Ensure the patient\'s mattress is angled at 30–45 degrees to prevent fluid pooling.\n\n' +
                '• Ask about the sterile procedures used when inserting the breathing tube.\n\n' +
                '• Confirm daily assessments of the patient\'s ability to breathe without the ventilator.\n\n' +
                '• Use positioning guides to keep the patient\'s head elevated.\n\n' +
                '• Monitor for signs of bed sores and reposition the patient as necessary.\n\n' +
                '• Check that oral hygiene protocols are followed.\n\n' +
                'Key Points:\n\n' +
                '• Ventilator-associated pneumonia is linked to improper positioning and contamination.\n\n' +
                '• Elevating the patient\'s head and ensuring strict sterile practices are key.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you observe that the patient\'s head is not properly elevated or if there are signs of respiratory distress.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Ventilator Pneumonia (VAP)</Text>
              <Text style={styles.selfHelpText}>Preventing pneumonia in ventilated patients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selfHelpCard}
              onPress={() => Alert.alert('Bed Sores', 
                'Prevention Tips:\n\n' +
                '• Reposition the patient at least every two hours.\n\n' +
                '• Use alternating air pressure mattresses and moisture-absorbing pads.\n\n' +
                '• Ensure foam cushions or padding are used on bony areas (ankles, knees, elbows, head, tailbone).\n\n' +
                '• Change wet gowns or sheets promptly.\n\n' +
                '• Use barrier creams for fragile skin areas.\n\n' +
                '• Increase protein in the diet if approved by the doctor.\n\n' +
                '• Regularly check the patient\'s skin for signs of pressure damage.\n\n' +
                'Key Points:\n\n' +
                '• Bed sores are highly preventable with frequent repositioning and proper bedding.\n\n' +
                '• They can lead to severe infections and complications if not addressed promptly.\n\n' +
                'When to Call a Nurse:\n\n' +
                '• If you notice any signs of skin breakdown, persistent redness, or pain in bony areas.'
              )}
            >
              <Text style={styles.selfHelpTitle}>Bed Sores (Pressure Ulcers)</Text>
              <Text style={styles.selfHelpText}>Preventing painful pressure injuries during immobility</Text>
            </TouchableOpacity>
            
            <Text style={[styles.sectionTitle, {marginTop: 30, marginBottom: 12}]}>Share Health Information</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.selfHelpText}>
                Share your medical analysis and comprehensive hospital infection prevention guide with family members, caregivers, or healthcare providers.
              </Text>
              <TouchableOpacity
                style={[styles.shareButton, {marginTop: 16, backgroundColor: '#10b981'}]}
                onPress={prepareEmailContent}
              >
                <Text style={styles.shareButtonText}>Email Complete Health Package (9 Prevention Guides)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {/* Email Modal */}
      <Modal
        visible={isEmailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEmailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Complete Health Package</Text>
            
            <Text style={styles.modalSubtitle}>
              This email will include your medical analysis and a comprehensive hospital infection prevention guide covering 9 critical areas: Superbugs, C. diff, Sepsis, Falls, Blood Clots, Medication Safety, UTIs, Ventilator Pneumonia, and Bed Sores.
            </Text>
            
            <Text style={styles.label}>Recipient Email</Text>
            <TextInput
              style={styles.input}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Message Preview</Text>
            <View style={styles.messagePreview}>
              <Text style={styles.previewText}>
                {emailMessage.length > 150 ? emailMessage.substring(0, 150) + '...' : emailMessage}
              </Text>
              <Text style={styles.previewNote}>
                (Full package includes medical analysis and a detailed 9-category infection prevention guide)
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEmailModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, isSendingEmail && styles.disabledButton]}
                onPress={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={[styles.sendButtonText, {marginLeft: 8}]}>Sending...</Text>
                  </View>
                ) : (
                  <Text style={styles.sendButtonText}>Send Complete Package</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  title: {
    fontSize: 22,
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
  selfHelpContainer: {
    marginBottom: 20,
  },
  selfHelpCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selfHelpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  selfHelpText: {
    color: '#4b5563',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#4b5563',
    marginBottom: 16,
    textAlign: 'center',
  },
  messagePreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewText: {
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 8,
  },
  previewNote: {
    color: '#6b7280',
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
}); 