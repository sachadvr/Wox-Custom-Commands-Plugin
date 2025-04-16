import {
  Context,
  Plugin,
  PluginInitParams,
  PublicAPI,
  Query,
  Result,
  WoxImage
} from "@wox-launcher/wox-plugin"
import { executeScript, loadShortcuts, substitutePlaceholders } from "./Utils"

let api: PublicAPI
let shortcuts: Shortcut[] = []

// TODO: make this configurable
const getIcon = (): WoxImage => ({
  ImageType: "relative",
  ImageData: "images/shell.png"
})

const buildResult = (title: string, subtitle: string, action: () => Promise<void>): Result => ({
  Title: title,
  SubTitle: subtitle,
  Icon: getIcon(),
  Actions: [{ Name: "Execute", Action: action }]
})

export const plugin: Plugin = {
  init: async (ctx: Context, initParams: PluginInitParams) => {
    api = initParams.API

    shortcuts = await loadShortcuts(ctx, api);

    await api.Log(ctx, "Info", `Plugin initialized with ${shortcuts.length} shortcuts loaded.`)

    await api.OnSettingChanged(ctx, async (setting) => {
      if (setting === "shortcuts") {
        shortcuts = await loadShortcuts(ctx, api)
      }
    })
  },

  query: async (ctx: Context, query: Query): Promise<Result[]> => {
    const search = query.Search?.trim() || ""

    if (!search) {
      return shortcuts.map(s => buildResult(s.shortcut, `Executes: ${substitutePlaceholders(s.script, [])}`, async () => executeScript(api, ctx, s)))
    }

    const lowerSearch = search.toLowerCase()
    const exactMatch = shortcuts.find(s => {
      const lowerShortcut = s.shortcut.toLowerCase()
      return lowerSearch === lowerShortcut || lowerSearch.startsWith(`${lowerShortcut} `)
    })

    if (exactMatch) {
      const args = search.substring(exactMatch.shortcut.length).trim().split(" ").filter(Boolean)
      const description = substitutePlaceholders(exactMatch.description || "", args) || substitutePlaceholders(exactMatch.script, args)

      return [buildResult(exactMatch.shortcut, `Executes: ${description}`, async () => executeScript(api, ctx, { ...exactMatch, args }))]
    }

    const partialMatches = shortcuts.filter(s => s.shortcut.toLowerCase().startsWith(lowerSearch))

    return partialMatches.map(s =>
      buildResult(s.shortcut, `Executes: ${substitutePlaceholders(s.description || "", []) || substitutePlaceholders(s.script, [])}`, async () => executeScript(api, ctx, s))
    )
  }
}
