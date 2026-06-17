import { Elysia, t } from 'elysia';
import { authService } from '../services/auth.service';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post('/login', async ({ body }) => {
    return authService.login(body.email, body.password);
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  });
