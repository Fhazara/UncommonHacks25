import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Dashboard: undefined;
  DrugAnalysis: undefined;
  SymptomAnalysis: undefined;
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function Dashboard({ navigation }: DashboardScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Healthcare Analyzer</Text>
        
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DrugAnalysis')}
        >
          <Text style={styles.cardTitle}>Drug Interaction Analysis</Text>
          <Text style={styles.cardDescription}>
            Analyze potential drug interactions and contraindications using the FDA database.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SymptomAnalysis')}
        >
          <Text style={styles.cardTitle}>Symptom Analysis</Text>
          <Text style={styles.cardDescription}>
            Get insights about your symptoms and potential alternative diagnoses.
          </Text>
        </TouchableOpacity>
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
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
}); 