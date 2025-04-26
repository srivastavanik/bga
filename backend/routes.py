from flask import Blueprint, request, jsonify
from .regulatory_analysis import generate_regulatory_report

regulatory_bp = Blueprint('regulatory', __name__)

@regulatory_bp.route('/regulatory-analysis', methods=['POST'])
def regulatory_analysis():
    user_input = request.json
    report = generate_regulatory_report(user_input)
    return jsonify({"report": report}) 