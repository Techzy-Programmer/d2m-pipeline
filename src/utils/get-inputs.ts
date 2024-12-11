import * as core from '@actions/core';
import { CoreInput, Strategy, WFInput } from "../types";
import { panic } from './general';

export function getInputs(): [WFInput, CoreInput] {
  return [
    {
      ...getStrategy(),
      local_user: core.getInput("localUser"),
      fail_on_error: core.getBooleanInput("failOnError"),
      local_parent_path: core.getInput("localParentPath"),
      post_deploy_cmds: parseCommand("postDeployCommands"),
      pre_deploy_cmds: parseCommand("preDeployCommands"),
    },
    {
      key: core.getMultilineInput("publicKey").join("\n"),
      host: core.getInput("machineHost"),
      port: core.getInput("machinePort"),
    },
  ];
}

function parseCommand(key: string): string[] {
  const value = core.getInput(key)
  
  try {
    const cmds = JSON.parse(value);
    if (!Array.isArray(cmds)) {
      panic(`'${key}' should be valid JSON array`);
    }

    return cmds as string[]
  } catch {
    if (value.includes("\n")) {
      return value.split("\n");
    }
  }

  panic(`'${key}' should be a valid JSON array or a string separated by newline character`);
}

function getStrategy(): Strategy {
  let strategy_type = core.getInput("strategy");
  if (!["repo", "dist", "docker"].includes(strategy_type)) {
    strategy_type = "empty";
  }

  switch (strategy_type) {
    case "repo":
      return {
        strategy_type,
        strategy: {
          auto_setup_deps: core.getBooleanInput("autoSetupDeps"),
          branch: core.getInput("branch"),
        },
      };

    case "dist":
      return {
        strategy_type,
        strategy: {
          file_name: '', // To be set after calling upload api
        },
      };
      
    case "docker":
      return {
        strategy_type,
        strategy: {},
      };
  }

  return {
    strategy_type: "empty",
  };
}
