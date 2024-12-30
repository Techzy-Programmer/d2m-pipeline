type RepoStrategy = {
  auto_setup_deps: boolean;
  branch: string;
}

type DistStrategy = {
  folder_to_upload: string;
  root_folder_name: string;
  file_name: string;
}

type DockerStrategy = {
}

export type Strategy = ({
  strategy: RepoStrategy;
  strategy_type: "repo";
} | {
  strategy: DistStrategy;
  strategy_type: "dist";
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
}) & Strategy;

export type CoreInput = {
  key: string;
  host: string;
  port: string;
}
