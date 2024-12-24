import { ActionFunctionArgs } from "@remix-run/node"
import { Form, redirect, useActionData } from "@remix-run/react"
import { useRef, useState } from "react"
import { commitSession, getSession } from "~/session.server"

const sanitizedPostCodeBrand = Symbol.for("sanitizedPostCode")
type ErrorInfoType = { error: false } | { error: true; msg: string }
type ValidationResultType =
  | {
      error: false
      sanitizedPostCode: string & { [sanitizedPostCodeBrand]: unknown }
    }
  | { error: true; msg: string }

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData()
  const formPostCode = String(form.get("post_code") || "0000000")
  const validationResult = validatePostCode(formPostCode)
  if (validationResult.error) return { error: true, msg: "無効な形式" }
  const { sanitizedPostCode } = validationResult
  const correctPostCode = process.env.POST_CODE || "1111111"
  if (correctPostCode === sanitizedPostCode) {
    const session = await getSession()
    session.set("verified", true)
    return redirect("/info", {
      headers: { "Set-Cookie": await commitSession(session) },
    })
  }
  return { error: true, msg: "郵便番号が違います。" }
}

// export const action = async ({}) => {
//   return json({ error: true, msg: "テストエラー" })
// }

const sanitizePostCode = (inputPostCode: string) => {
  const replacingFlow: [string | RegExp, string][] = [
    ["０", "0"],
    ["１", "1"],
    ["２", "2"],
    ["３", "3"],
    ["４", "4"],
    ["５", "5"],
    ["６", "6"],
    ["７", "7"],
    ["８", "8"],
    ["９", "9"],
    ["-", ""],
    [/[^0-9]/, ""],
  ]
  const sanitizedPostCode = replacingFlow
    .reduce(
      (currentCode, replacer) => currentCode.replace(...replacer),
      inputPostCode
    )
    .slice(0, 7) as typeof inputPostCode & { [sanitizedPostCodeBrand]: unknown }
  return sanitizedPostCode
}

const validatePostCode = (inputPostCode: string): ValidationResultType => {
  const sanitizedPostCode = sanitizePostCode(inputPostCode)
  const isValid =
    sanitizedPostCode === inputPostCode && inputPostCode.length === 7
  return isValid
    ? { error: false, sanitizedPostCode }
    : { error: true, msg: "無効な形式" }
}

export default function Login() {
  const serverErrorInfo = useActionData<ErrorInfoType>() || { error: false }
  const [postCode, setPostCode] = useState("")
  const [errorInfo, setErrorInfo] = useState<ErrorInfoType>({ error: false })
  const postCodeInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElm = event.target
    const inputPostCode = inputElm.value
    const selectionPos = inputElm.selectionEnd ?? 0
    const sanitizedPostCode = sanitizePostCode(inputPostCode)
    inputElm.value = sanitizedPostCode
    inputElm.setSelectionRange(
      selectionPos,
      selectionPos - Number(inputPostCode !== sanitizedPostCode)
    )
    setErrorInfo({ error: false })
    setPostCode(inputElm.value)
  }
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const validationResult = validatePostCode(postCode)
    if (validationResult.error) {
      setErrorInfo(validationResult)
      event.preventDefault()
      postCodeInputRef.current?.focus()
    }
  }
  return (
    <div>
      <Form
        className="flex flex-col items-center justify-start gap-4 relative h-64 max-w-72"
        method="POST"
        onSubmit={handleSubmit}
      >
        <label className="block text-left" htmlFor="post_code-input">
          <p>アクセスありがとうございます。</p>
          <p>
            <span className="inline-block">個人情報のためパスワード入力の</span>
            <span className="inline-block">ご協力をお願いいたします。</span>
          </p>
          <br />
          <p>パスワード：服部自宅の郵便番号</p>
        </label>
        <div className="w-full">
          <input
            className="block text-center border p-4 tracking-widest font-code w-full"
            onChange={handleChange}
            id="post_code-input"
            name="post_code"
            type="text"
            inputMode="decimal"
            placeholder="0000000"
            value={postCode}
            ref={postCodeInputRef}
            autoFocus
          />
          {errorInfo.error ? (
            <div className="text-red-600 text-center w-full">
              {errorInfo.msg}
            </div>
          ) : null}
          {serverErrorInfo.error ? (
            <div className="text-red-600 text-center w-full">
              {serverErrorInfo.msg}
            </div>
          ) : null}
        </div>
        <input
          className="border p-4 rounded-lg w-24 ml-auto"
          type="submit"
          value="送信"
        />
      </Form>
    </div>
  )
}
