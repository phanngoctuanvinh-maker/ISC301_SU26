const path = require('path');

function registerSwagger(app) {
  const specPath = path.join(__dirname, '../../openapi_spec.yaml');

  app.get('/swagger/openapi.yaml', (req, res) => {
    return res.sendFile(specPath);
  });

  app.get('/swagger', (req, res) => {
    const specUrl = `${req.protocol}://${req.get('host')}/swagger/openapi.yaml`;

    return res.type('html').send(`<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swagger Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #fafafa;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          persistAuthorization: true
        });
      };
    </script>
  </body>
</html>`);
  });
}

module.exports = {
  registerSwagger
};
