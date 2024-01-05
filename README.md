# Monorepo

npx nx g @nx/node:application <app-name>
npx nx g @nx/node:library <app-name>
npx nx g @nx/workspace:remove <app-name>

#tctl
tctl workflow signal --workflow_id "HelloSignal" --name "updateGreeting"

# add new flow

npx nx g @nx/node:application

create interface in interfaces/src/lib/workflows

sync interface

task sync
