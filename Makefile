NAME="fox"

buid:
	@echo "Building docker image..."
	@docker build . -t $(NAME)
	@echo "Run using: 'docker run --rm -d -p 127.0.0.1:8082:8080 $(NAME)'"

.PHONY: build
