document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const body = document.body;

  // Darkmode TOggle
  function toggleTheme() {
    body.classList.toggle('light-mode');
    const isLightMode = body.classList.contains('light-mode');
    themeToggleBtn.textContent = isLightMode ? '🌙 Dark' : '☀️ Light';
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }


  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    themeToggleBtn.textContent = '🌙 Dark';
  } else {
    body.classList.remove('light-mode');
    themeToggleBtn.textContent = '☀️ Light';
  }

  themeToggleBtn.addEventListener('click', toggleTheme);

//Berechnen Button
  const calculateBtn = document.getElementById('calculateBtn');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculate);
  }

//analyse der matrixeingabe
  function parseMatrix(text) {
    return text.trim().split("\n").map(line => 
        line.trim().split(/[\s,]+/) 
        .filter(entry => entry !== "")
        .map(Number)
    );
  }

  function matrixMult(a, b) {
    const n = a.length;
    if (n === 0 || a[0].length !== b.length) {
        throw new Error("Matrixdimensionen sind für die Multiplikation nicht kompatibel.");
    }
    const m = b[0].length;
    const res = Array.from({ length: n }, () => Array(m).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        for (let k = 0; k < a[0].length; k++) {
          res[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return res;
  }

  function potenz(matrix, k) {
    if (k < 1) throw new Error("Potenz k muss mindestens 1 sein.");
    if (matrix.length === 0 || matrix.length !== matrix[0].length) {
        throw new Error("Potenzierung ist nur für quadratische Matrizen definiert.");
    }
    if (k === 1) return matrix.map(row => [...row]);

    let result = matrix.map(row => [...row]);
    for (let i = 1; i < k; i++) {
      result = matrixMult(result, matrix);
    }
    return result;
  }

  function berechneDistanzen(adjazenzMatrix) {
    const n = adjazenzMatrix.length;
    if (n === 0) return [];

    const dists = Array.from({ length: n }, (_, i) => 
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0;
        if (adjazenzMatrix[i][j] > 0) return 1;
        return Infinity;
      })
    );

    let aktuellePotenz = adjazenzMatrix.map(row => row.map(val => val > 0 ? 1 : 0));
    for (let p = 2; p < n + 1 ; p++) { 
        let neuePotenz = adjazenzMatrix.map(row => row.map(val => val > 0 ? 1 : 0)); 
        for(let powCount = 1; powCount < p; powCount++){ 
            neuePotenz = matrixMult(neuePotenz, adjazenzMatrix.map(row => row.map(val => val > 0 ? 1 : 0)));
        }

        if (p > 1) {
            aktuellePotenz = matrixMult(aktuellePotenz, adjazenzMatrix.map(row => row.map(val => val > 0 ? 1 : 0)));
        }

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (aktuellePotenz[i][j] > 0 && dists[i][j] === Infinity) {
                    dists[i][j] = p;
                }
            }
        }
    }
    return dists.map(row => row.map(d => d === Infinity ? -1 : d));
  }

  function berechneExzentrizitaeten(dists) {
    if (dists.length === 0) return { exz: [], radius: -1, durchmesser: -1, zentrum: [] };
    const exz = dists.map(row => {
        if (row.includes(-1)) return -1; 
        return Math.max(...row.filter(d => d >= 0));
    });
    
    const gueltigeExz = exz.filter(e => e !== -1);
    if (gueltigeExz.length === 0) return { exz, radius: -1, durchmesser: -1, zentrum: [] };

    const radius = Math.min(...gueltigeExz);
    const durchmesser = Math.max(...gueltigeExz);
    const zentrum = [];
    exz.forEach((e, i) => {
      if (e === radius) {
        zentrum.push(i);
      }
    });
    return { exz, radius, durchmesser, zentrum };
  }

  function printMatrix(title, matrix) {
    let outputText = `${title}\n`;
    if (matrix.length === 0) {
        outputText += "(Leere Matrix)\n";
    } else {
        matrix.forEach(row => {
            outputText += row.map(v => v.toString().padStart(3)).join(" ") + "\n";
        });
    }
    return outputText + "\n";
  }

  function calculate() {
    const outputEl = document.getElementById("output");
    outputEl.textContent = "Berechne...";
    
    setTimeout(() => {
        try {
            const matrixInputVal = document.getElementById("matrixInput").value;
            if (!matrixInputVal.trim()) {
                outputEl.textContent = "Fehler: Bitte eine Adjazenzmatrix eingeben oder hochladen.";
                return;
            }
            const matrix = parseMatrix(matrixInputVal);

            if (matrix.length === 0) {
                 outputEl.textContent = "Fehler: Matrix ist leer.";
                 return;
            }
            const n = matrix.length;
            for(let i = 0; i < n; i++) {
                if (matrix[i].length !== n) {
                    outputEl.textContent = "Fehler: Matrix muss quadratisch sein und alle Zeilen die gleiche Länge haben.";
                    return;
                }
                for(let j = 0; j < n; j++) {
                    if (isNaN(matrix[i][j])) {
                        outputEl.textContent = `Fehler: Ungültiger Wert in Matrix an Position [${i}][${j}]. Nur Zahlen erlaubt.`;
                        return;
                    }
                }
            }

            const k = parseInt(document.getElementById("powerInput").value);
            if (isNaN(k) || k < 1) {
                outputEl.textContent = "Fehler: Potenz k muss eine positive ganze Zahl sein.";
                return;
            }

            let resultText = "";
            
            const potenzMatrix = potenz(matrix, k);
            resultText += printMatrix(`Potenzmatrix A^${k} (Anzahl der Wege der Länge ${k}):`, potenzMatrix);
            
            const dists = berechneDistanzen(matrix);
            resultText += printMatrix("Distanzmatrix (kürzeste Wege, -1 falls nicht erreichbar):", dists);
            
            const { exz, radius, durchmesser, zentrum } = berechneExzentrizitaeten(dists);
            resultText += "Exzentrizitäten:\n";
            if (exz.length > 0) {
                exz.forEach((e, i) => resultText += `Knoten ${i}: Exzentrizität = ${e === -1 ? "undefiniert (nicht alle Knoten erreichbar)" : e}\n`);
            } else {
                resultText += "(Keine Exzentrizitäten berechnet)\n";
            }
            
            resultText += `\nRadius = ${radius === -1 ? "undefiniert" : radius}\n`;
            resultText += `Durchmesser = ${durchmesser === -1 ? "undefiniert" : durchmesser}\n`;
            resultText += `Zentrum (Knotenindizes) = ${zentrum.length > 0 ? `[${zentrum.join(", ")}]` : "keins (oder Graph nicht zusammenhängend)"}\n`;

            outputEl.textContent = resultText;

        } catch (err) {
            outputEl.textContent = `Fehler bei der Berechnung: ${err.message}\n${err.stack ? "Stack: " + err.stack : ""}`;
            console.error("Berechnungsfehler:", err);
        }
    }, 10);
  }

  const csvUploadInput = document.getElementById("csvUpload");
  if (csvUploadInput) {
    csvUploadInput.addEventListener("change", function(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.trim().split("\n").map(l => l.trim().split(",").map(val => val.trim()).join(" ")).join("\n");
        document.getElementById("matrixInput").value = lines;
      };
      reader.onerror = function() {
          document.getElementById("output").textContent = "Fehler beim Lesen der CSV-Datei.";
      };
      reader.readAsText(file);
    });
  }
});