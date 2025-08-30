import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
import hashlib
import json
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class AdvancedH2VerificationModel:
    def __init__(self):
        print("🚀 Advanced H₂ Verification ML Model Initialized!")
        self.model_version = "2.0.0"
        self.confidence_threshold = 0.85
        self.fraud_threshold = 0.7
        
        # Initialize model parameters
        self.efficiency_ranges = {
            'wind': {'min': 40, 'max': 55, 'optimal': 47.5}
        }
        
        # Historical data patterns for anomaly detection
        self.historical_patterns = self._initialize_historical_patterns()
        
        # Fraud detection patterns
        self.fraud_patterns = self._initialize_fraud_patterns()
        
    def _initialize_historical_patterns(self) -> Dict:
        """Initialize historical production patterns"""
        return {
            'seasonal_factors': {
                'spring': 1.05, 'summer': 1.15, 'autumn': 1.0, 'winter': 0.9
            },
            'time_of_day': {
                'peak': 1.1, 'off_peak': 0.95, 'night': 0.85
            },
            'weather_impact': {
                'sunny': 1.08, 'cloudy': 1.0, 'rainy': 0.92, 'stormy': 0.75
            }
        }
    
    def _initialize_fraud_patterns(self) -> Dict:
        """Initialize known fraud patterns"""
        return {
            'suspicious_efficiency': 0.8,
            'unusual_production_volume': 0.7,
            'time_pattern_anomaly': 0.6,
            'geographic_anomaly': 0.75,
            'equipment_mismatch': 0.9
        }
    
    def verify_h2_production(self, 
                           energy_mwh: float, 
                           h2_kg: float, 
                           production_method: str = "electrolysis",
                           location: str = "unknown",
                           timestamp: str = None,
                           equipment_specs: Dict = None,
                           weather_data: Dict = None,
                           historical_data: List[Dict] = None) -> Dict:
        """
        Advanced H₂ production verification using multiple ML algorithms
        """
        print(f"🔍 Verifying H₂ production: {h2_kg}kg from {energy_mwh}MWh using {production_method}")
        
        # Basic efficiency calculation
        efficiency_kwh_per_kg = (energy_mwh * 1000) / h2_kg
        
        # Multi-algorithm validation
        validation_results = self._run_validation_algorithms(
            energy_mwh, h2_kg, efficiency_kwh_per_kg, production_method,
            location, timestamp, equipment_specs, weather_data, historical_data
        )
        
        # Calculate composite scores
        composite_score = self._calculate_composite_score(validation_results)
        fraud_probability = self._calculate_fraud_probability(validation_results)
        confidence_level = self._calculate_confidence_level(validation_results)
        
        return {
            'verification_id': self._generate_verification_id(),
            'timestamp': datetime.now().isoformat(),
            'model_version': self.model_version,
            
            # Core results
            'is_valid': composite_score >= self.confidence_threshold,
            'composite_score': float(composite_score),
            'fraud_probability': float(fraud_probability),
            'confidence_level': float(confidence_level),
            
            # Efficiency metrics
            'calculated_efficiency': float(efficiency_kwh_per_kg),
            'efficiency_score': float(validation_results['efficiency_validation']['score']),
            'efficiency_rating': self._get_efficiency_rating(efficiency_kwh_per_kg, production_method),
            
            # Production validation
            'production_validation': validation_results['production_validation'],
            'energy_validation': validation_results['energy_validation'],
            
            # Advanced analysis
            'anomaly_detection': validation_results['anomaly_detection'],
            'pattern_analysis': validation_results['pattern_analysis'],
            'risk_assessment': validation_results['risk_assessment'],
            
            # Input data
            'energy_input_mwh': float(energy_mwh),
            'h2_production_kg': float(h2_kg),
            'production_method': production_method,
            'location': location,
            
            # Recommendations
            'recommendations': self._generate_recommendations(validation_results),
            'next_steps': self._generate_next_steps(validation_results, composite_score)
        }
    
    def _run_validation_algorithms(self, energy_mwh, h2_kg, efficiency, method, 
                                  location, timestamp, equipment, weather, historical):
        """Run multiple validation algorithms"""
        results = {}
        
        # 1. Efficiency Validation
        results['efficiency_validation'] = self._validate_efficiency(efficiency, method)
        
        # 2. Production Volume Validation
        results['production_validation'] = self._validate_production_volume(energy_mwh, h2_kg, method)
        
        # 3. Energy Input Validation
        results['energy_validation'] = self._validate_energy_input(energy_mwh, method, equipment)
        
        # 4. Anomaly Detection
        results['anomaly_detection'] = self._detect_anomalies(energy_mwh, h2_kg, efficiency, method, location, timestamp)
        
        # 5. Pattern Analysis
        results['pattern_analysis'] = self._analyze_patterns(energy_mwh, h2_kg, method, location, timestamp, weather, historical)
        
        # 6. Risk Assessment
        results['risk_assessment'] = self._assess_risk(results, location, method)
        
        return results
    
    def _validate_efficiency(self, efficiency: float, method: str) -> Dict:
        """Validate efficiency against known ranges"""
        ranges = self.efficiency_ranges.get(method, self.efficiency_ranges['electrolysis'])
        
        if ranges['min'] <= efficiency <= ranges['max']:
            score = 1.0 - abs(efficiency - ranges['optimal']) / (ranges['max'] - ranges['min'])
            rating = 'excellent' if score > 0.9 else 'good' if score > 0.7 else 'acceptable'
        else:
            score = 0.1
            rating = 'poor'
        
        return {
            'score': max(0.1, min(1.0, score)),
            'rating': rating,
            'expected_range': ranges,
            'deviation': abs(efficiency - ranges['optimal']),
            'is_within_range': ranges['min'] <= efficiency <= ranges['max']
        }
    
    def _validate_production_volume(self, energy_mwh: float, h2_kg: float, method: str) -> Dict:
        """Validate production volume against energy input"""
        expected_min = energy_mwh * 1000 / self.efficiency_ranges[method]['max']
        expected_max = energy_mwh * 1000 / self.efficiency_ranges[method]['min']
        
        if expected_min <= h2_kg <= expected_max:
            score = 1.0
            rating = 'normal'
        else:
            deviation = min(abs(h2_kg - expected_min), abs(h2_kg - expected_max))
            score = max(0.1, 1.0 - (deviation / expected_min))
            rating = 'suspicious'
        
        return {
            'score': score,
            'rating': rating,
            'expected_range': {'min': expected_min, 'max': expected_max},
            'actual_production': h2_kg,
            'deviation_percentage': abs(h2_kg - (expected_min + expected_max) / 2) / ((expected_min + expected_max) / 2) * 100
        }
    
    def _validate_energy_input(self, energy_mwh: float, method: str, equipment: Dict = None) -> Dict:
        """Validate energy input against method and equipment constraints"""
        # Method-specific energy constraints
        method_constraints = {
            'wind': {'min': 0.5, 'max': 500, 'typical': 25}
        }
        
        constraints = method_constraints.get(method, method_constraints['electrolysis'])
        
        if constraints['min'] <= energy_mwh <= constraints['max']:
            score = 1.0
            rating = 'normal'
        else:
            score = 0.1
            rating = 'suspicious'
        
        return {
            'score': score,
            'rating': rating,
            'constraints': constraints,
            'is_within_constraints': constraints['min'] <= energy_mwh <= constraints['max'],
            'equipment_compatibility': self._check_equipment_compatibility(energy_mwh, method, equipment)
        }
    
    def _detect_anomalies(self, energy_mwh, h2_kg, efficiency, method, location, timestamp) -> Dict:
        """Detect anomalies using statistical methods"""
        anomalies = []
        anomaly_score = 0.0
        
        # Statistical outlier detection (simplified)
        if efficiency < self.efficiency_ranges[method]['min'] * 0.8:
            anomalies.append('extremely_low_efficiency')
            anomaly_score += 0.3
        
        if efficiency > self.efficiency_ranges[method]['max'] * 1.2:
            anomalies.append('extremely_high_efficiency')
            anomaly_score += 0.3
        
        # Production volume anomaly
        expected_h2 = energy_mwh * 1000 / self.efficiency_ranges[method]['optimal']
        if abs(h2_kg - expected_h2) / expected_h2 > 0.5:
            anomalies.append('unusual_production_volume')
            anomaly_score += 0.2
        
        # Time-based anomalies
        if timestamp:
            time_anomaly = self._detect_time_anomaly(timestamp)
            if time_anomaly:
                anomalies.append('time_anomaly')
                anomaly_score += 0.2
        
        return {
            'detected_anomalies': anomalies,
            'anomaly_score': min(1.0, anomaly_score),
            'anomaly_count': len(anomalies),
            'severity': 'high' if anomaly_score > 0.5 else 'medium' if anomaly_score > 0.2 else 'low'
        }
    
    def _analyze_patterns(self, energy_mwh, h2_kg, method, location, timestamp, weather, historical) -> Dict:
        """Analyze production patterns for consistency"""
        pattern_score = 1.0
        patterns = []
        seasonal_factor = 1.0
        weather_factor = 1.0
        consistency = 1.0
        
        # Seasonal pattern analysis
        if timestamp:
            season = self._get_season(timestamp)
            seasonal_factor = self.historical_patterns['seasonal_factors'].get(season, 1.0)
            patterns.append(f'seasonal_factor_{season}:{seasonal_factor}')
        
        # Weather impact analysis
        if weather:
            weather_factor = self.historical_patterns['weather_impact'].get(weather.get('condition', 'normal'), 1.0)
            patterns.append(f'weather_impact:{weather_factor}')
        
        # Historical consistency
        if historical:
            consistency = self._check_historical_consistency(energy_mwh, h2_kg, method, historical)
            pattern_score *= consistency
            patterns.append(f'historical_consistency:{consistency}')
        
        return {
            'score': pattern_score,
            'patterns': patterns,
            'seasonal_adjustment': seasonal_factor,
            'weather_adjustment': weather_factor,
            'historical_consistency': consistency
        }
    
    def _assess_risk(self, validation_results: Dict, location: str, method: str) -> Dict:
        """Assess overall risk level"""
        risk_factors = []
        risk_score = 0.0
        
        # Efficiency risk
        if validation_results['efficiency_validation']['score'] < 0.7:
            risk_factors.append('low_efficiency')
            risk_score += 0.3
        
        # Production risk
        if validation_results['production_validation']['score'] < 0.7:
            risk_factors.append('suspicious_production')
            risk_score += 0.3
        
        # Anomaly risk
        if validation_results['anomaly_detection']['anomaly_score'] > 0.5:
            risk_factors.append('high_anomalies')
            risk_score += 0.4
        
        # Location risk (simplified)
        if location == 'unknown':
            risk_factors.append('unknown_location')
            risk_score += 0.1
        
        risk_level = 'low' if risk_score < 0.3 else 'medium' if risk_score < 0.6 else 'high'
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'mitigation_suggestions': self._suggest_mitigation(risk_factors)
        }
    
    def _calculate_composite_score(self, validation_results: Dict) -> float:
        """Calculate composite validation score"""
        weights = {
            'efficiency': 0.3,
            'production': 0.25,
            'energy': 0.2,
            'anomaly': 0.15,
            'pattern': 0.1
        }
        
        composite = (
            validation_results['efficiency_validation']['score'] * weights['efficiency'] +
            validation_results['production_validation']['score'] * weights['production'] +
            validation_results['energy_validation']['score'] * weights['energy'] +
            (1.0 - validation_results['anomaly_detection']['anomaly_score']) * weights['anomaly'] +
            validation_results['pattern_analysis']['score'] * weights['pattern']
        )
        
        return max(0.0, min(1.0, composite))
    
    def _calculate_fraud_probability(self, validation_results: Dict) -> float:
        """Calculate fraud probability based on multiple factors"""
        fraud_indicators = 0.0
        
        # Efficiency fraud
        if validation_results['efficiency_validation']['score'] < 0.5:
            fraud_indicators += 0.3
        
        # Production fraud
        if validation_results['production_validation']['score'] < 0.5:
            fraud_indicators += 0.3
        
        # Anomaly fraud
        fraud_indicators += validation_results['anomaly_detection']['anomaly_score'] * 0.4
        
        return min(1.0, fraud_indicators)
    
    def _calculate_confidence_level(self, validation_results: Dict) -> float:
        """Calculate confidence level in the verification"""
        base_confidence = 0.8
        
        # Reduce confidence for anomalies
        if validation_results['anomaly_detection']['anomaly_score'] > 0.5:
            base_confidence *= 0.7
        
        # Reduce confidence for low scores
        if validation_results['efficiency_validation']['score'] < 0.7:
            base_confidence *= 0.8
        
        return max(0.1, min(1.0, base_confidence))
    
    def _get_efficiency_rating(self, efficiency: float, method: str) -> str:
        """Get efficiency rating based on method and value"""
        ranges = self.efficiency_ranges.get(method, self.efficiency_ranges['electrolysis'])
        optimal = ranges['optimal']
        
        if abs(efficiency - optimal) / optimal < 0.1:
            return 'excellent'
        elif abs(efficiency - optimal) / optimal < 0.2:
            return 'good'
        elif abs(efficiency - optimal) / optimal < 0.3:
            return 'acceptable'
        else:
            return 'poor'
    
    def _generate_recommendations(self, validation_results: Dict) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        if validation_results['efficiency_validation']['score'] < 0.7:
            recommendations.append("Consider optimizing production process for better efficiency")
        
        if validation_results['anomaly_detection']['anomaly_score'] > 0.5:
            recommendations.append("Investigate detected anomalies before approval")
        
        if validation_results['risk_assessment']['risk_level'] == 'high':
            recommendations.append("Require additional verification and documentation")
        
        if not recommendations:
            recommendations.append("Production data appears valid and within expected ranges")
        
        return recommendations
    
    def _generate_next_steps(self, validation_results: Dict, composite_score: float) -> List[str]:
        """Generate next steps based on verification results"""
        if composite_score >= self.confidence_threshold:
            return ["Approve for credit issuance", "Monitor for future consistency"]
        elif composite_score >= 0.6:
            return ["Request additional documentation", "Schedule follow-up verification"]
        else:
            return ["Reject application", "Request comprehensive audit", "Investigate potential fraud"]
    
    def _generate_verification_id(self) -> str:
        """Generate unique verification ID"""
        timestamp = datetime.now().isoformat()
        random_component = np.random.randint(1000, 9999)
        return f"VER_{timestamp[:10]}_{random_component}"
    
    def _get_season(self, timestamp: str) -> str:
        """Get season from timestamp"""
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            month = dt.month
            if month in [3, 4, 5]:
                return 'spring'
            elif month in [6, 7, 8]:
                return 'summer'
            elif month in [9, 10, 11]:
                return 'autumn'
            else:
                return 'winter'
        except:
            return 'unknown'
    
    def _detect_time_anomaly(self, timestamp: str) -> bool:
        """Detect time-based anomalies"""
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            hour = dt.hour
            
            # Flag unusual production hours
            if hour < 6 or hour > 22:
                return True
            
            return False
        except:
            return False
    
    def _check_equipment_compatibility(self, energy_mwh: float, method: str, equipment: Dict = None) -> bool:
        """Check if equipment is compatible with energy input"""
        if not equipment:
            return True  # Assume compatible if no equipment data
        
        # Simplified compatibility check
        max_capacity = equipment.get('max_capacity_mwh', float('inf'))
        return energy_mwh <= max_capacity
    
    def _check_historical_consistency(self, energy_mwh: float, h2_kg: float, method: str, historical: List[Dict]) -> float:
        """Check consistency with historical data"""
        if not historical or len(historical) < 3:
            return 1.0  # Assume consistent if insufficient data
        
        # Calculate average efficiency from historical data
        historical_efficiencies = []
        for record in historical[-10:]:  # Last 10 records
            if record.get('method') == method:
                eff = (record.get('energy_mwh', 0) * 1000) / record.get('h2_kg', 1)
                historical_efficiencies.append(eff)
        
        if not historical_efficiencies:
            return 1.0
        
        avg_efficiency = np.mean(historical_efficiencies)
        current_efficiency = (energy_mwh * 1000) / h2_kg
        
        # Calculate consistency score
        deviation = abs(current_efficiency - avg_efficiency) / avg_efficiency
        consistency = max(0.1, 1.0 - deviation)
        
        return consistency
    
    def _suggest_mitigation(self, risk_factors: List[str]) -> List[str]:
        """Suggest mitigation strategies for identified risks"""
        mitigation_map = {
            'low_efficiency': 'Implement efficiency optimization measures',
            'suspicious_production': 'Verify production data with additional sources',
            'high_anomalies': 'Conduct detailed investigation of anomalies',
            'unknown_location': 'Verify facility location and ownership',
            'equipment_mismatch': 'Verify equipment specifications and capacity'
        }
        
        return [mitigation_map.get(factor, 'Review and validate data') for factor in risk_factors]

# Global model instance
advanced_h2_model = AdvancedH2VerificationModel()
