import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-salary-structures',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/payroll/salary-structures')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([
              { id: "SAL-STR-01", name: "Principal", branchId: "Main Campus", branch: "Main Campus", basicSalary: 11000, status: "Active" },
              { id: "SAL-STR-02", name: "Teacher", branchId: "Main Campus", branch: "Main Campus", basicSalary: 8000, status: "Active" },
              { id: "SAL-STR-03", name: "Teacher Grade A", branchId: "Main Campus", branch: "Main Campus", basicSalary: 25000, status: "Active" }
            ]));
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://backspace-prowler-bleach.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  }
})
