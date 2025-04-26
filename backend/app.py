from flask import Flask
from .routes import regulatory_bp

app = Flask(__name__)
app.register_blueprint(regulatory_bp, url_prefix='/api/regulatory')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 