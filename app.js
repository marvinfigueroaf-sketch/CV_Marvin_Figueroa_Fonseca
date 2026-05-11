document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scrolling for navigation links (if on index page)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Admin Upload Logic
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        const fileInput = document.getElementById('file');
        const fileDropArea = document.getElementById('fileDropArea');
        const fileMessage = document.querySelector('.file-message');
        const uploadBtn = document.getElementById('uploadBtn');
        const statusMessage = document.getElementById('uploadStatus');

        // Update file name display
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileMessage.textContent = this.files[0].name;
            } else {
                fileMessage.textContent = 'Arrastra tu archivo aquí o haz clic para seleccionar';
            }
        });

        // Drag and drop styles
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => {
                fileDropArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => {
                fileDropArea.classList.remove('dragover');
            }, false);
        });

        fileDropArea.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileMessage.textContent = files[0].name;
            }
        });

        // Form Submission
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const file = fileInput.files[0];
            const password = document.getElementById('password').value;

            if (!file) {
                showStatus('Por favor, selecciona un archivo.', 'error');
                return;
            }

            if (!password) {
                showStatus('Por favor, ingresa la contraseña.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('password', password);

            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Subiendo...';
            statusMessage.className = 'status-message';
            statusMessage.style.display = 'none';

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    showStatus(result.message, 'success');
                    uploadForm.reset();
                    fileMessage.textContent = 'Arrastra tu archivo aquí o haz clic para seleccionar';
                } else {
                    showStatus(result.error || 'Error al subir el archivo', 'error');
                }
            } catch (error) {
                showStatus('Error de conexión con el servidor', 'error');
                console.error(error);
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Subir Documento';
            }
        });

        function showStatus(message, type) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message status-${type}`;
        }
    }

    // Load Documents on Index Page
    const documentsContainer = document.getElementById('documentsContainer');
    if (documentsContainer) {
        const renderDocuments = (files) => {
            if (!files || files.length === 0) {
                documentsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: var(--secondary-color);">No hay documentos disponibles en este momento.</p>';
                return;
            }
            
            documentsContainer.innerHTML = '';
            files.forEach(file => {
                const extension = file.split('.').pop().toLowerCase();
                let icon = '📄';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) icon = '🖼️';
                if (['pdf'].includes(extension)) icon = '📕';

                const card = document.createElement('div');
                card.className = 'card glass-card hover-lift';
                card.innerHTML = `
                    <div class="card-body" style="text-align: center; padding: 2rem 1rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
                        <h3 style="margin-bottom: 1rem; font-size: 1rem; word-break: break-all;">${file}</h3>
                        <a href="uploads/${file}" target="_blank" class="btn-outline" style="display: inline-block; margin-top: 1rem;">Ver Documento</a>
                    </div>
                `;
                documentsContainer.appendChild(card);
            });
        };

        // Try API first, then fallback to static JSON
        fetch('/api/documents')
            .then(response => {
                if (!response.ok) throw new Error('API not available');
                return response.json();
            })
            .then(files => renderDocuments(files))
            .catch(err => {
                console.log("API no disponible, intentando cargar documents.json estático...");
                fetch('documents.json')
                    .then(response => response.json())
                    .then(files => renderDocuments(files))
                    .catch(err2 => {
                        console.error("Error cargando documentos:", err2);
                        documentsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: var(--secondary-color);">Error al cargar los documentos.</p>';
                    });
            });
    }
});
