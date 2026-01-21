UUID = pulsepick@github.com-silentglasses
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

.PHONY: all build install uninstall clean zip

all: build

build:
	@if [ -d schemas ] && ls schemas/*.xml 1>/dev/null 2>&1; then \
		echo "Compiling schemas..."; \
		glib-compile-schemas schemas/; \
	fi
	@if [ -d locale ]; then \
		echo "Compiling translations..."; \
		for po in locale/*/LC_MESSAGES/*.po; do \
			if [ -f "$$po" ]; then \
				mo="$${po%.po}.mo"; \
				msgfmt "$$po" -o "$$mo"; \
			fi \
		done \
	fi

install: build
	@echo "Installing to $(INSTALL_DIR)..."
	@mkdir -p $(INSTALL_DIR)
	@cp -r metadata.json extension.js $(INSTALL_DIR)/
	@[ -f prefs.js ] && cp prefs.js $(INSTALL_DIR)/ || true
	@[ -f stylesheet.css ] && cp stylesheet.css $(INSTALL_DIR)/ || true
	@[ -d schemas ] && cp -r schemas $(INSTALL_DIR)/ || true
	@[ -d locale ] && cp -r locale $(INSTALL_DIR)/ || true
	@echo "Done. Restart GNOME Shell and enable with:"
	@echo "  gnome-extensions enable $(UUID)"

uninstall:
	@echo "Removing $(INSTALL_DIR)..."
	@rm -rf $(INSTALL_DIR)

zip: build
	@echo "Creating extension zip..."
	@zip -r $(UUID).shell-extension.zip \
		metadata.json \
		extension.js \
		$(shell [ -f prefs.js ] && echo "prefs.js") \
		$(shell [ -f stylesheet.css ] && echo "stylesheet.css") \
		$(shell [ -d schemas ] && echo "schemas/") \
		$(shell [ -d locale ] && echo "locale/")
	@echo "Created $(UUID).shell-extension.zip"

clean:
	@rm -f $(UUID).shell-extension.zip
	@rm -f schemas/gschemas.compiled
	@find locale -name "*.mo" -delete 2>/dev/null || true
