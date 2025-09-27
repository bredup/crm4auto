import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Custom middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth).*)']
}
