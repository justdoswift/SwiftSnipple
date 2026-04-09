package main

import (
	"context"
	"log"
	"os"

	"swiftsnipple/api/internal/config"
	"swiftsnipple/api/internal/db"
)

func main() {
	cfg := config.Load()

	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	if command != "up" {
		log.Fatalf("unsupported migrate command: %s", command)
	}

	if err := db.RunMigrations(context.Background(), cfg.DatabaseURL); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	log.Println("migrations completed")
}
