use std::fmt::Display;
use std::process;
use std::sync::Arc;

use clap::{Parser, Subcommand};

use api::{handler, operator};
use client::git::{Client as GitClientTrait, ClientImpl as GitClient};
use data::{AppContext, ProjectContext, ProjectId};
use registry::{AppRegistryImpl, BootstrapRegistryImpl};
use shared::{
    error::{AppError, AppResult},
    utility,
};

#[derive(Parser, Debug)]
struct CreateArgs {
    #[arg(long)]
    name: String,
}

#[derive(Subcommand, Debug)]
enum OperatorCommands {
    Teardown,
}

#[derive(Subcommand, Debug)]
enum HandlerCommands {
    Init,
    CreateSession(CreateArgs),
    HealthCheck,
}

#[derive(Subcommand, Debug)]
enum SubCommands {
    #[command(flatten)]
    Operator(OperatorCommands),
    #[command(flatten)]
    Handler(HandlerCommands),
}

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    subcommand: SubCommands,
}

fn handle_result<T: Display>(result: AppResult<T>) {
    match result {
        Ok(value) => println!("{value}"),
        Err(err) => {
            eprintln!("{err}");
            process::exit(1);
        }
    }
}

fn handle_error(result: AppResult<()>) {
    if let Err(err) = result {
        eprintln!("{err}");
        process::exit(1);
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    let home_dir = utility::home_dir().map_err(|e| AppError::IoError(e.to_string()))?;

    let app_ctx = AppContext::new(home_dir.clone());
    let bootstrap = BootstrapRegistryImpl::new(app_ctx);
    handle_error(operator::prerequisite_check(&bootstrap));
    handle_error(operator::initialize(&bootstrap));

    match cli.subcommand {
        SubCommands::Operator(operator) => match operator {
            OperatorCommands::Teardown => {
                handle_error(operator::teardown(&bootstrap));
            }
        },
        SubCommands::Handler(handler) => {
            // --- プロジェクト初期化 ---
            let app_context = Arc::new(AppContext::new(home_dir));
            let git_client =
                Box::new(GitClient::new().map_err(|e| AppError::GitError(e.to_string()))?);
            let repository_root = git_client.project_root();
            let project_id = ProjectId::from(repository_root.as_path());
            let project_ctx = ProjectContext::new(app_context, project_id, repository_root);
            handle_error(operator::initialize_project(&project_ctx));

            let registry = AppRegistryImpl::new(git_client, project_ctx);

            match handler {
                HandlerCommands::Init => {
                    println!("hello init");
                }
                HandlerCommands::CreateSession(args) => {
                    println!("hello create session");
                    println!("{}", args.name);
                }
                HandlerCommands::HealthCheck => {
                    handle_result(handler::health::health_check(&registry).await);
                }
            }
        }
    }

    Ok(())
}
