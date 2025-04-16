import { Context, PublicAPI } from "@wox-launcher/wox-plugin"
import { exec } from "child_process"
import path from "path"

const defaultValue: Shortcut[] = []

export async function loadShortcuts(ctx: Context, api: PublicAPI): Promise<Shortcut[]> {
  try {
    const raw = await api.GetSetting(ctx, "shortcuts")
    return JSON.parse(raw) as Shortcut[]
  } catch (error) {
    console.error("Failed to parse shortcuts setting:", error)
    return defaultValue as Shortcut[]
  }
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
