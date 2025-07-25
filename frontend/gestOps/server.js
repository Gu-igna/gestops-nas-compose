const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;

// Servir archivos estáticos desde dist/gest-ops/browser
app.use(express.static(path.join(__dirname, 'dist/gest-ops/browser'), {
  maxAge: '1y', // Cache para archivos estáticos
}));

// Para cualquier ruta que no sea un archivo estático, servir index.html (Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/gest-ops/browser/index.html'));
});

app.listen(PORT, () => {
  console.log(`GestOps running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
