// Herramienta de diagnóstico para verificar conectividad con Xano
export class ApiDiagnostic {
  private static readonly API_URL = process.env.NEXT_PUBLIC_XANO_CONTENT_API || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";
  private static readonly AUTH_URL = process.env.NEXT_PUBLIC_XANO_AUTH_API || "https://x8ki-letl-twmt.n7.xano.io/api:SzJNIj2V";

  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log("🔍 Probando conectividad con Xano...");
      
      // Test básico de conectividad usando la URL base (que devuelve Swagger UI)
      const response = await fetch(`${this.API_URL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: "✅ Conexión exitosa con Xano",
          details: { 
            status: response.status, 
            statusText: response.statusText,
            contentType: response.headers.get('content-type')
          }
        };
      } else {
        return {
          success: false,
          message: `❌ Error de conexión: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Error de red: ${error.message}`,
        details: error
      };
    }
  }

  static async testAuthEndpoints(): Promise<{
    login: boolean;
    signup: boolean;
    me: boolean;
    details: any;
  }> {
    const results = {
      login: false,
      signup: false,
      me: false,
      details: {} as any
    };

    // Test endpoint de login
    try {
      const loginResponse = await fetch(`${this.AUTH_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@test.com", password: "test" })
      });
      results.login = loginResponse.status !== 404;
      results.details.login = {
        status: loginResponse.status,
        available: results.login
      };
    } catch (error) {
      results.details.login = { error: error };
    }

    // Test endpoint de signup
    try {
      const signupResponse = await fetch(`${this.AUTH_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: "test@test.com", 
          password: "test",
          name: "Test User",
          phone: "123456789"
        })
      });
      results.signup = signupResponse.status !== 404;
      results.details.signup = {
        status: signupResponse.status,
        available: results.signup
      };
    } catch (error) {
      results.details.signup = { error: error };
    }

    // Test endpoint de me
    try {
      const meResponse = await fetch(`${this.AUTH_URL}/auth/me`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      results.me = meResponse.status !== 404;
      results.details.me = {
        status: meResponse.status,
        available: results.me
      };
    } catch (error) {
      results.details.me = { error: error };
    }

    return results;
  }

  static logDiagnosticInfo() {
    console.log("🔧 Información de diagnóstico:");
    console.log("API Base URL:", this.API_URL);
    console.log("User Agent:", navigator.userAgent);
    console.log("Timestamp:", new Date().toISOString());
    
    // Verificar localStorage
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");
    
    console.log("🔑 Estado de autenticación local:");
    console.log("Token presente:", !!token);
    console.log("Usuario en cache:", !!user);
    
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log("Datos del usuario:", parsedUser);
      } catch (e) {
        console.log("Error al parsear usuario:", e);
      }
    }
  }
}