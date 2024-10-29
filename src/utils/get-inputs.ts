import * as core from '@actions/core';
import { Strategy, WFInput } from "../types";

export function getInputs(): WFInput {
  return {
    ...getStrategy(),
    local_user: core.getInput("localUser"),
    fail_on_error: core.getBooleanInput("failOnError"),
    local_parent_path: core.getInput("localParentPath"),
    post_deploy_cmds: parseCommand("postDeployCommands"),
    pre_deploy_cmds: parseCommand("preDeployCommands"),

    core: {
      key: core.getMultilineInput("publicKey").join("\n"),
      host: core.getInput("machineHost"),
      port: core.getInput("machinePort"),
    }
  };
}

function parseCommand(key: string): string[] {
  const value = core.getInput(key)
  
  try {
    const cmds = JSON.parse(value);
    if (!Array.isArray(cmds)) {
      core.setFailed(`'${key}' should be valid JSON array`);
      return [];
    }

    return cmds as string[]
  } catch {
    if (value.includes("\n")) {
      return value.split("\n");
    }
  }

  core.setFailed(`'${key}' should be a valid JSON array or a string separated by newline character`);
  return [];
}

function getStrategy(): Strategy {
  let strategy_type = core.getInput("strategy");
  if (!["empty", "repo", "docker"].includes(strategy_type)) {
    strategy_type = "empty";
  }

  if (strategy_type === "repo") {
    return {
      strategy_type,
      strategy: {
        auto_setup_deps: core.getBooleanInput("autoSetupDeps"),
        branch: core.getInput("branch"),
      },
    };
  }
  else if (strategy_type === "docker") {
    return {
      strategy_type,
      strategy: {},
    };
  }

  return {
    strategy_type: "empty",
  };
}
