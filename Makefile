node_modules: package.json package-lock.json
	npm ci
	touch node_modules

# Compile typescript interfaces from a json schema
# E.g. npx typescript-json-schema ./tsconfig.json SomeData --include ./path/to/SomeData.schema.ts --required
%.json-schema.json: %.schema.ts node_modules
	npx typescript-json-schema ./tsconfig.json $(notdir $*) --include $< --required --rejectDateType -o $@

# Produce checker functions based on json schema
%.schema.check.ts: %.json-schema.json ./src/make_templates/isSchema
	cat ./src/make_templates/isSchema | sed "s/%%name%%/$(notdir $*)/g" > $@

.PHONY: schemas
schemas: $(shell find ./src -type f | grep -Eo ".*\.schema.ts$$")
	@$(MAKE) $(patsubst %.schema.ts,%.json-schema.json,$^) $(patsubst %.schema.ts,%.schema.check.ts,$^)
