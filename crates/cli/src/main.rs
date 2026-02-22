use std::fmt::Display;
use std::process;

use clap::{Parser, Subcommand};

use api::{handler, operator};
use registry::{AppRegistryImpl, BootstrapRegistryImpl};
use shared::error::AppResult;

#[derive(Parser, Debug)]
struct CreateArgs {
    #[arg(long)]
    name: String,
}

#[derive(Subcommand, Debug)]
enum OperatorCommands {
    Init,
    Teardown,
}

#[derive(Subcommand, Debug)]
enum HandlerCommands {
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

    let bootstrap = BootstrapRegistryImpl::new();
    handle_error(operator::prerequisite_check(&bootstrap));

    match cli.subcommand {
        SubCommands::Operator(operator) => match operator {
            OperatorCommands::Init => {
                println!("hello init");
            }
            OperatorCommands::Teardown => {
                println!("hello teardown");
            }
        },
        SubCommands::Handler(handler) => {
            let registry = AppRegistryImpl::new();

            match handler {
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
