const fs = require('fs');
const p = 'c:/quản lý bán hàng/be_sm/src/behavior/behavior.controller.ts';
let code = fs.readFileSync(p, 'utf8');
code = code.replace(
`  }
    return this.behaviorService.getPendingLogsForManager(req.user);
  }

  @Patch('manager/logs/evaluate/:id')`,
`  }

  @Patch('manager/logs/evaluate/:id')`
);
fs.writeFileSync(p, code);
console.log('Fixed behavior.controller.ts');
