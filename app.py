from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.json
        
        # Extraer datos del request
        num_states = int(data['num_states'])
        state_names = data['state_names']
        matrix = np.array(data['matrix'], dtype=float)
        initial_state = np.array(data['initial_state'], dtype=float)
        steps = int(data['steps'])
        
        # Validaciones
        if len(state_names) != num_states:
            return jsonify({'error': 'El número de nombres no coincide con el número de estados'}), 400
        
        if matrix.shape != (num_states, num_states):
            return jsonify({'error': f'La matriz debe ser de {num_states}x{num_states}'}), 400
        
        if len(initial_state) != num_states:
            return jsonify({'error': f'El vector inicial debe tener {num_states} elementos'}), 400
        
        # Validar que cada columna suma 1 (con tolerancia)
        column_sums = np.sum(matrix, axis=0)
        if not np.allclose(column_sums, 1.0, atol=1e-6):
            return jsonify({
                'error': f'Cada columna de la matriz debe sumar 1. Sumas actuales: {column_sums.tolist()}'
            }), 400
        
        # Validar que el vector inicial suma 1
        if not np.isclose(np.sum(initial_state), 1.0, atol=1e-6):
            return jsonify({
                'error': f'El vector inicial debe sumar 1. Suma actual: {np.sum(initial_state)}'
            }), 400
        
        # Calcular la evolución de los estados
        results = []
        v_current = initial_state.copy()
        
        # Agregar estado inicial
        results.append({
            'step': 0,
            'vector': v_current.tolist(),
            'vector_rounded': np.round(v_current, 6).tolist()
        })
        
        # Calcular cada paso: v_{n+1} = P^T · v_n
        # Nota: multiplicamos por la transpuesta porque queremos v · P
        P_transpose = matrix.T
        
        for step in range(1, steps + 1):
            v_current = P_transpose @ v_current
            results.append({
                'step': step,
                'vector': v_current.tolist(),
                'vector_rounded': np.round(v_current, 6).tolist()
            })
        
        # Preparar respuesta
        response = {
            'success': True,
            'state_names': state_names,
            'matrix': matrix.tolist(),
            'results': results,
            'num_states': num_states
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)