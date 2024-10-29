type RepoStrategy = {
  auto_setup_deps: boolean;
  branch: string;
}

type DockerStrategy = {
}

export type Strategy = ({
  strategy: RepoStrategy;
  strategy_type: "repo";
} | {
  strategy: DockerStrategy;
  strategy_type: "docker";
}| {
  strategy_type: "empty";
})

export type WFInput = ({
  pre_deploy_cmds: string[];
  post_deploy_cmds: string[];
  local_parent_path: string;
  fail_on_error: boolean;
  local_user: string;
  core: {
    host: string;
    port: string;
    key: string;
  }
}) & Strategy;
