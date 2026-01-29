#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import chalk from 'chalk';
import degit from 'degit';

/**
 * 主程序入口
 * 负责交互式收集信息并执行脚手架创建流程
 */
async function main() {
  console.log(chalk.bold.cyan('欢迎使用 create-newpkg 创建新项目！'));

  // 1. 获取项目名称/目标目录
  // 优先从命令行参数获取，如果没有则通过 prompts 询问用户
  let targetDir = process.argv[2];

  if (!targetDir) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: '请输入项目名称 (Project Name):',
      initial: 'my-new-pkg'
    });

    // 如果用户取消（Ctrl+C），response.projectName 可能为空
    if (!response.projectName) {
      console.log(chalk.red('操作已取消'));
      process.exit(0);
    }
    targetDir = response.projectName;
  }

  // 计算绝对路径
  const root = path.resolve(process.cwd(), targetDir);

  // 2. 检查目录状态
  // 避免覆盖已有文件，除非用户确认
  if (fs.existsSync(root)) {
    if (fs.readdirSync(root).length > 0) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `目录 "${targetDir}" 不为空。是否继续并可能覆盖文件？`,
        initial: false
      });

      if (!response.overwrite) {
        console.log(chalk.red('操作已取消'));
        process.exit(0);
      }
    }
  } else {
    // 目录不存在则创建
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(chalk.blue(`
正在下载模板到 ${targetDir}...`));

  // 3. 使用 degit 拉取模板
  // 模板源：https://github.com/qzrzz/newpkg
  const emitter = degit('qzrzz/newpkg', {
    cache: false,
    force: true,
    verbose: true,
  });

  try {
    await emitter.clone(root);
  } catch (err) {
    console.error(chalk.red('下载模板失败:'), err.message);
    process.exit(1);
  }

  // 4. 清理工作
  // 模板中包含了 npminit 目录（即本脚手架代码），在新项目中不需要，应当移除
  const npminitPath = path.join(root, 'npminit');
  if (fs.existsSync(npminitPath)) {
    fs.rmSync(npminitPath, { recursive: true, force: true });
  }

  // 5. 更新 package.json
  // 修改项目名称为用户输入的名称，重置版本号，并移除不必要的 bin 配置
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    // 设置新项目的名称
    pkg.name = path.basename(root);
    // 重置版本号
    pkg.version = '0.0.0';
    
    // 移除模板中指向 npminit 的 bin 配置，因为 npminit 目录已被移除
    if (pkg.bin === 'npminit' || (typeof pkg.bin === 'object' && pkg.bin['newpkg'])) {
       delete pkg.bin;
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  // 6. 完成提示
  console.log(chalk.green(`
项目 ${targetDir} 创建成功！
`));
  console.log('接下来你可以运行：\n');
  console.log(chalk.cyan(`  cd ${targetDir}`));
  console.log(chalk.cyan('  bun install'));
  console.log(chalk.cyan('  bun dev'));
  console.log('\n祝你编码愉快！');
}

main().catch((err) => {
  console.error(chalk.red('发生未预期的错误:'), err);
  process.exit(1);
});