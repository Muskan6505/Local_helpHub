import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {Provider} from 'react-redux'
import {store} from './store/store.js'
import { GoogleMapsProvider } from './GoogleMapsProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleMapsProvider>
        <App />
      </GoogleMapsProvider>
    </Provider>
  </StrictMode>,
)
