import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

document.body.onmousedown = function(e) {
    if(e.button == 1) {
        e.preventDefault();
        return false;
    }
}

createApp(App).mount('#app')
