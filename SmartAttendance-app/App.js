import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Vistas ────────────────────────────────────────────────────────────────────
import ProfesorView    from './components/ProfesorView';
import EstudianteView  from './components/EstudianteView';
import QRView          from './components/QRView';
import ResultadoView   from './components/ResultadoView';
import ManualView      from './components/ManualView';
import ExportView      from './components/ExportView';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="ProfesorView"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="ProfesorView"   component={ProfesorView}   />
        <Stack.Screen name="EstudianteView" component={EstudianteView} />
        <Stack.Screen name="QRView"         component={QRView}         />
        <Stack.Screen name="ResultadoView"  component={ResultadoView}  />
        <Stack.Screen name="ManualView"     component={ManualView}     />
        <Stack.Screen name="ExportView"     component={ExportView}     />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});