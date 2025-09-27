import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    image?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string
    }
  }
}
