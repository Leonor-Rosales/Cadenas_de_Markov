// variables globales
let network = null;
let currentResults = null;

// función para descargar PDF con todos los resultados
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;

    // título del reporte
    pdf.setFontSize(20);
    pdf.setTextColor(33, 150, 243);
    pdf.text('Reporte de Cadena de Markov', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // información general
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Número de estados: ${currentResults.num_states}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Estados: ${currentResults.state_names.join(', ')}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Pasos simulados: ${currentResults.results.length - 1}`, 20, yPosition);
    yPosition += 15;

    // matriz de transición
    pdf.setFontSize(14);
    pdf.setTextColor(33, 150, 243);
    pdf.text('Matriz de Transición P:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const matrix = currentResults.matrix;
    for (let i = 0; i < matrix.length; i++) {
        const row = matrix[i].map(val => val.toFixed(2)).join('  ');
        pdf.text(`[ ${row} ]`, 30, yPosition);
        yPosition += 6;
    }
    yPosition += 10;

    // vector inicial
    pdf.setFontSize(14);
    pdf.setTextColor(33, 150, 243);
    pdf.text('Vector Inicial:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const initialVector = currentResults.results[0].vector_rounded.map(v => v.toFixed(4)).join(', ');
    pdf.text(`[ ${initialVector} ]`, 30, yPosition);
    yPosition += 15;

    // evolución de estados paso a paso
    pdf.setFontSize(14);
    pdf.setTextColor(33, 150, 243);
    pdf.text('Evolución de Estados:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    for (const result of currentResults.results) {
        // verificar si se necesita nueva página
        if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
        }

        pdf.setFont(undefined, 'bold');
        pdf.text(`Paso ${result.step}:`, 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 6;

        for (let i = 0; i < result.vector_rounded.length; i++) {
            const stateName = currentResults.state_names[i];
            const prob = result.vector_rounded[i].toFixed(6);
            pdf.text(`  ${stateName}: ${prob}`, 25, yPosition);
            yPosition += 5;
        }
        yPosition += 3;
    }

    // capturar y agregar el grafo
    yPosition += 10;
    if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(33, 150, 243);
    pdf.text('Grafo de Estados:', 20, yPosition);
    yPosition += 10;

    const graphElement = document.getElementById('graph');
    const canvas = await html2canvas(graphElement, { 
        scale: 2,
        backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 170;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // verificar espacio en página actual
    if (yPosition + imgHeight > 280) {
        pdf.addPage();
        yPosition = 20;
    }
    
    pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);

    // guardar archivo
    pdf.save('reporte_cadena_markov.pdf');
}

// generar campos dinámicos según el número de estados
function generateInputs() {
    const numStates = parseInt(document.getElementById('numStates').value);
    
    // generar inputs para nombres de estados
    const stateNamesDiv = document.getElementById('stateNames');
    stateNamesDiv.innerHTML = '';
    for (let i = 0; i < numStates; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `state${i}`;
        input.placeholder = `ej. Estado ${i + 1}`;
        input.required = true;
        stateNamesDiv.appendChild(input);
    }

    // generar matriz de transición
    const matrixDiv = document.getElementById('matrixInput');
    matrixDiv.innerHTML = '';
    for (let i = 0; i < numStates; i++) {
        const row = document.createElement('div');
        row.className = 'matrix-row';
        row.style.gridTemplateColumns = `repeat(${numStates}, 1fr)`;
        for (let j = 0; j < numStates; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min = '0';
            input.max = '1';
            input.id = `matrix${i}${j}`;
            input.placeholder = `ej. 0.${Math.floor(Math.random() * 9) + 1}`;
            input.required = true;
            row.appendChild(input);
        }
        matrixDiv.appendChild(row);
    }

    // generar vector inicial
    const vectorDiv = document.getElementById('vectorInput');
    vectorDiv.innerHTML = '';
    vectorDiv.style.gridTemplateColumns = `repeat(${numStates}, 1fr)`;
    for (let i = 0; i < numStates; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.min = '0';
        input.max = '1';
        input.id = `vector${i}`;
        input.placeholder = `ej. 0.${Math.floor(Math.random() * 9) + 1}`;
        input.required = true;
        vectorDiv.appendChild(input);
    }

    document.getElementById('dynamicInputs').classList.remove('hidden');
}

// dibujar grafo de estados con vis.js
function drawGraph(stateNames, matrix) {
    // crear nodos con colores diferentes
    const nodes = stateNames.map((name, i) => {
        const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];
        return {
            id: i,
            label: name,
            shape: 'circle',
            size: 30,
            font: { size: 16, color: 'white', bold: true },
            color: {
                background: colors[i % colors.length],
                border: colors[i % colors.length],
                highlight: { 
                    background: colors[i % colors.length], 
                    border: '#333' 
                }
            }
        };
    });

    // crear aristas con probabilidades
    const edges = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] > 0) {
                edges.push({
                    from: j,
                    to: i,
                    label: matrix[i][j].toFixed(2),
                    arrows: 'to',
                    font: { size: 12, align: 'middle', background: 'white' },
                    color: { color: '#666', highlight: '#2196F3' },
                    smooth: { type: 'curvedCW', roundness: i === j ? 0.5 : 0.2 }
                });
            }
        }
    }

    // configurar y renderizar grafo
    const container = document.getElementById('graph');
    const data = { nodes, edges };
    const options = {
        physics: {
            enabled: true,
            stabilization: { iterations: 200 }
        },
        layout: {
            randomSeed: 42
        }
    };

    if (network) network.destroy();
    network = new vis.Network(container, data, options);
}

// manejar envío del formulario
document.getElementById('markovForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const numStates = parseInt(document.getElementById('numStates').value);
    
    // recopilar nombres de estados
    const stateNames = [];
    for (let i = 0; i < numStates; i++) {
        stateNames.push(document.getElementById(`state${i}`).value);
    }

    // recopilar matriz de transición
    const matrix = [];
    for (let i = 0; i < numStates; i++) {
        const row = [];
        for (let j = 0; j < numStates; j++) {
            row.push(parseFloat(document.getElementById(`matrix${i}${j}`).value));
        }
        matrix.push(row);
    }

    // recopilar vector inicial
    const initialState = [];
    for (let i = 0; i < numStates; i++) {
        initialState.push(parseFloat(document.getElementById(`vector${i}`).value));
    }

    const steps = parseInt(document.getElementById('steps').value);

    // mostrar indicador de carga
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        // enviar datos al backend
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                num_states: numStates,
                state_names: stateNames,
                matrix: matrix,
                initial_state: initialState,
                steps: steps
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el cálculo');
        }

        // guardar resultados para PDF
        currentResults = data;

        // dibujar grafo
        drawGraph(data.state_names, data.matrix);

        // mostrar resultados paso a paso
        const stepsContainer = document.getElementById('stepsContainer');
        stepsContainer.innerHTML = '';

        data.results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'step-card';
            
            let tableHTML = `
                <h3>Paso ${result.step}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Probabilidad</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            result.vector_rounded.forEach((prob, i) => {
                tableHTML += `
                    <tr>
                        <td><strong>${data.state_names[i]}</strong></td>
                        <td>${prob.toFixed(6)}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            card.innerHTML = tableHTML;
            stepsContainer.appendChild(card);
        });

        document.getElementById('results').classList.remove('hidden');

    } catch (error) {
        document.getElementById('error').textContent = error.message;
        document.getElementById('error').classList.remove('hidden');
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
});