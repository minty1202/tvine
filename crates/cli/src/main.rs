use clap::{Parser, Subcommand};

use api::handler;
use registry::AppRegistryImpl;

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

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    let registry = AppRegistryImpl::new();

    match cli.subcommand {
        SubCommands::CreateSession(args) => {
            println!("hello create session");

            println!("{}", args.name);
        }
        SubCommands::HealthCheck => {
            let result = handler::health::health_check(&registry).await;
            println!("{}", result);
        }
    }
}
