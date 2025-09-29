const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const forgotPasswordLink = document.getElementById('forgotPassword');

        // Credenciales de demostración
        const validCredentials = {
            'admin': 'admin123',
            'usuario': '123456',
            'demo': 'demo123'
        };

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }

        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
        }

        function hideMessages() {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }

        function setLoading(isLoading) {
            if (isLoading) {
                loginBtn.classList.add('loading');
                loginBtn.disabled = true;
                loginBtn.style.position = 'relative';
                loginBtn.textContent = '';
            } else {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                loginBtn.style.position = 'static';
                loginBtn.textContent = 'Iniciar Sesión';
            }
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            hideMessages();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Validaciones básicas
            if (!username) {
                showError('Por favor ingrese su usuario');
                usernameInput.focus();
                return;
            }

            if (!password) {
                showError('Por favor ingrese su contraseña');
                passwordInput.focus();
                return;
            }

            // Simular carga
            setLoading(true);

            // Simular delay de autenticación
            setTimeout(() => {
                // Verificar credenciales
                if (validCredentials[username] && validCredentials[username] === password) {
                    showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
                    
                    // Guardar usuario en memoria (simular sesión)
                    sessionStorage.setItem('loggedUser', username);
                    sessionStorage.setItem('loginTime', new Date().toISOString());
                    
                    // Simular redirección después de 2 segundos
                    setTimeout(() => {
                        // Aquí normalmente redirigirías a la página principal
                        localStorage.setItem("logueado", "true");
                        window.location.href = "index.html";
                    }, 2000);
                } else {
                    showError('Usuario o contraseña incorrectos. Por favor intente nuevamente.');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
                setLoading(false);
            }, 1500);
        });

        // Auto-completar con credenciales de demo al hacer click en el campo usuario
        usernameInput.addEventListener('focus', function() {
            if (!this.value) {
                this.value = 'admin';
                setTimeout(() => passwordInput.focus(), 100);
            }
        });

        // Mejorar UX - Enter para navegar entre campos
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                passwordInput.focus();
            }
        });

        // Verificar si ya hay una sesión activa al cargar la página
        window.addEventListener('load', function() {
            const loggedUser = sessionStorage.getItem('loggedUser');
            const loginTime = sessionStorage.getItem('loginTime');
            
            if (loggedUser && loginTime) {
                const loginDate = new Date(loginTime);
                const now = new Date();
                const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);
                
                // Sesión válida por 8 horas
                if (hoursSinceLogin < 8) {
                    showSuccess(`Bienvenido de vuelta, ${loggedUser}. Tu sesión sigue activa.`);
                } else {
                    // Limpiar sesión expirada
                    sessionStorage.removeItem('loggedUser');
                    sessionStorage.removeItem('loginTime');
                }
            }
        });