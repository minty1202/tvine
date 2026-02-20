use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
struct CreateArgs {
    #[arg(long)]
    name: String,
}

#[derive(Subcommand, Debug)]
enum SubCommands {
    CreateSession(CreateArgs),
}

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    subcommand: SubCommands,
}

fn main() {
    let cli = Cli::parse();

    match cli.subcommand {
        SubCommands::CreateSession(args) => {
            println!("hello create session");

            println!("{}", args.name)
        }
    }
}
