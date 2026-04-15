import { registerRootComponent } from 'expo';
import App from './App';

// Este es el punto de entrada de la app. Expo registra el componente App
// como el componente raíz y maneja la configuración del entorno automáticamente
// sin importar si se ejecuta en Expo Go o en un build nativo
registerRootComponent(App);
