use std::fmt::Display;
use std::process;

use clap::{Parser, Subcommand};

use api::handler;
use registry::AppRegistryImpl;
use shared::error::AppResult;

#[derive(Parser, Debug)]
struct CreateArgs {
    #[arg(long)]
    name: String,
}

#[derive(Subcommand, Debug)]
enum SubCommands {
    CreateSession(CreateArgs),
    HealthCheck,
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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let registry = AppRegistryImpl::new();

    match cli.subcommand {
        SubCommands::CreateSession(args) => {
            println!("hello create session");
            println!("{}", args.name);
        }
        SubCommands::HealthCheck => {
            handle_result(handler::health::health_check(&registry).await);
        }
    }

    Ok(())
}
