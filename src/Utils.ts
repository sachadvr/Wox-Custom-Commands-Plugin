import { Context, PublicAPI } from "@wox-launcher/wox-plugin"
import { exec } from "child_process"
import path from "path"
import fs from "fs"

export function loadShortcuts(): Shortcut[] {
  const configPath = path.join(__dirname, "shortcuts.json")
  let shortcuts: Shortcut[] = []
  try {
    const data = fs.readFileSync(configPath, "utf-8")
    shortcuts = JSON.parse(data) as Shortcut[]
  } catch (error) {
    console.error("Failed to load shortcuts:", error)
  }
  return shortcuts
}

export function substitutePlaceholders(script: string, args: string[]): string {
  let result = script
  result = result.replace(/\$@/g, args.join(" "))
  result = result.replace(/\$(\d+)/g, (_, index) => {
    const idx = parseInt(index, 10) - 1
    return args[idx] || ""
  })
  return result
}

export function executeScript(api: PublicAPI, ctx: Context, shortcut: Shortcut) {
  const needsSubstitution = /\$@|\$\d+/.test(shortcut.script)
  const command = needsSubstitution ? substitutePlaceholders(shortcut.script, shortcut.args || []) : shortcut.script
  exec(command, (error, stdout, stderr) => {
    if (error) {
      api.Log(ctx, "Error", `Execution error: ${error.message}`)
    }
    if (stdout) {
      api.Log(ctx, "Info", `Output: ${stdout}`)
    }
    if (stderr) {
      api.Log(ctx, "Info", `Error output: ${stderr}`)
    }
  })
}

export function getOpenCommandForPlatform(filePath: string): string {
  switch (process.platform) {
    case "win32":
      return `start "" "${filePath}"`
    case "darwin":
      return `open "${filePath}"`
    default:
      return `xdg-open "${filePath}"`
  }
}

export const openShortcutsConfig = async (api: PublicAPI, ctx: Context) => {
  const configPath = path.join(__dirname, "shortcuts.json")
  const command = getOpenCommandForPlatform(configPath)
  exec(command, error => {
    if (error) api.Log(ctx, "Error", `Failed to open settings file: ${error.message}`)
  })
}
