const fs = require('fs');

// Patch SalesActivityReport
let file1 = 'c:/quản lý bán hàng/be_sm/src/behavior/entities/sales-activity-report.entity.ts';
let code1 = fs.readFileSync(file1, 'utf8');
if (!code1.includes('logDate')) {
  code1 = code1.replace('userId: string;', 'userId: string;\n\n  @Column({ name: "log_date", type: "date", default: () => "CURRENT_DATE" })\n  logDate: string;');
  fs.writeFileSync(file1, code1);
}

// Patch BeliefTransformationLog
let file2 = 'c:/quản lý bán hàng/be_sm/src/behavior/entities/belief-transformation-log.entity.ts';
let code2 = fs.readFileSync(file2, 'utf8');
if (!code2.includes('logDate')) {
  code2 = code2.replace('userId: string;', 'userId: string;\n\n  @Column({ name: "log_date", type: "date", default: () => "CURRENT_DATE" })\n  logDate: string;');
  fs.writeFileSync(file2, code2);
}

// Patch BehaviorService
let file3 = 'c:/quản lý bán hàng/be_sm/src/behavior/behavior.service.ts';
let code3 = fs.readFileSync(file3, 'utf8');

// Update submitForm4 to find/create by logDate
if (!code3.includes('this.salesActivityReportsRepository.findOne({ userId, logDate })')) {
  code3 = code3.replace(
    'private async submitForm4(userId: string, dto: SubmitLogDto) {',
    `private async submitForm4(userId: string, dto: SubmitLogDto) {
    const logDate = this.resolveLogDate(dto.logDate);
    let record = await this.salesActivityReportsRepository.findOne({ userId, logDate });
    if (!record) {
      record = this.salesActivityReportsRepository.create({ userId, logDate });
    }`
  );
  code3 = code3.replace(
    /const record = this.salesActivityReportsRepository.create\(\{[\s\S]*?\}\);/,
    `record.customerName = dto.customerName || '';
    record.customerIssue = dto.customerIssue || '';
    record.consequence = dto.consequence || '';
    record.solutionOffered = dto.solutionOffered || '';
    record.valueBasedPricing = dto.valueBasedPricing || '';
    record.result = dto.result || '';`
  );
}

// Update submitForm8 to find/create by logDate
if (!code3.includes('this.beliefTransformationLogsRepository.findOne({ userId, logDate })')) {
  code3 = code3.replace(
    'private async submitForm8(userId: string, dto: SubmitLogDto) {',
    `private async submitForm8(userId: string, dto: SubmitLogDto) {
    const logDate = this.resolveLogDate(dto.logDate);
    let record = await this.beliefTransformationLogsRepository.findOne({ userId, logDate });
    if (!record) {
      record = this.beliefTransformationLogsRepository.create({ userId, logDate });
    }`
  );
  code3 = code3.replace(
    /const record = this.beliefTransformationLogsRepository.create\(\{[\s\S]*?\}\);/,
    `record.situation = dto.situation || '';
    record.oldBelief = dto.oldBelief || '';
    record.newChosenBelief = dto.newChosenBelief || '';
    record.newBehavior = dto.newBehavior || '';
    record.result = dto.transformationResult || '';`
  );
}

// Add getLogsHistory to BehaviorService
if (!code3.includes('async getLogsHistory(')) {
  code3 = code3.replace(
    'async getPendingLogsForManager(currentUser: any) {',
    `async getLogsHistory(userId: string, logDate: string) {
    return {
      form2: await this.behaviorChecklistLogsRepository.findOne({ userId, logDate }),
      form3: await this.mindsetLogsRepository.findOne({ userId, logDate }),
      form4: await this.salesActivityReportsRepository.findOne({ userId, logDate }),
      form5: await this.endOfDayLogsRepository.findOne({ userId, logDate }),
      form8: await this.beliefTransformationLogsRepository.findOne({ userId, logDate }),
    };
  }

  async getPendingLogsForManager(currentUser: any) {`
  );
}
fs.writeFileSync(file3, code3);

// Patch BehaviorController
let file4 = 'c:/quản lý bán hàng/be_sm/src/behavior/behavior.controller.ts';
let code4 = fs.readFileSync(file4, 'utf8');
if (!code4.includes("@Get('logs/history')")) {
  code4 = code4.replace(
    'import {',
    'import { Query,'
  );
  code4 = code4.replace(
    'getPendingLogs(@Req() req: any) {',
    `getPendingLogs(@Req() req: any) {
    return this.behaviorService.getPendingLogsForManager(req.user);
  }

  @Get('logs/history')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  getLogsHistory(@Req() req: any, @Query('logDate') logDate: string, @Query('userId') userId: string) {
    // If employee, force userId to themselves. If manager/admin, they can query specific userId.
    const targetUserId = req.user.role === Role.EMPLOYEE ? req.user.id : (userId || req.user.id);
    return this.behaviorService.getLogsHistory(targetUserId, logDate);
  }`
  );
  code4 = code4.replace(
    `getPendingLogs(@Req() req: any) {
    return this.behaviorService.getPendingLogsForManager(req.user);
  }

  @Get('manager/logs/pending')`,
    `@Get('manager/logs/pending')`
  );
  fs.writeFileSync(file4, code4);
}
console.log('Backend patched!');
