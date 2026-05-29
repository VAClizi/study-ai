import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

export async function loginWithCredentials(email: string, password: string) {
  const result = await nextAuthSignIn("credentials", {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    throw new Error(result.error === "CredentialsSignin" ? "邮箱或密码错误" : result.error)
  }

  return result
}

export async function loginWithGoogle() {
  await nextAuthSignIn("google", { callbackUrl: "/chat" })
}

export async function registerAndLogin(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "注册失败")
  }

  await loginWithCredentials(email, password)
}

export async function logout() {
  await nextAuthSignOut({ redirect: false })
}
