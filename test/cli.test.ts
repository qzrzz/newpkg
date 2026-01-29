import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const cliPath = path.resolve(__dirname, '../npminit/index.js');
// 使用 dist 目录存放临时测试生成的文件，避免污染 git
const outputDir = path.resolve(__dirname, '../dist/test-cli-output');

describe('create-newpkg CLI', () => {
  beforeAll(() => {
    // 确保清理以前的测试文件
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // 测试结束后清理
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it('should create a new project with provided name', async () => {
    // 我们通过命令行参数传递目录名，以避免交互式提示
    // 注意：此测试依赖于 degit 成功下载存储库。
    // 如果网络不通或存储库不存在，测试将失败。
    
    try {
        // 使用 node 执行脚本
        // 增加超时时间，因为涉及网络请求
        const { stdout, stderr } = await execAsync(`node ${cliPath} ${outputDir}`);
        
        // 验证输出目录存在
        expect(fs.existsSync(outputDir)).toBe(true);
        // 验证 package.json 存在
        expect(fs.existsSync(path.join(outputDir, 'package.json'))).toBe(true);
        
        const pkg = JSON.parse(fs.readFileSync(path.join(outputDir, 'package.json'), 'utf-8'));
        // 验证项目名称已更新
        expect(pkg.name).toBe('test-cli-output');
        // 验证版本号已重置
        expect(pkg.version).toBe('0.0.0');
        // 验证 bin 配置已被移除 (如果存在)
        expect(pkg.bin).toBeUndefined();
        
        // 验证 npminit 目录已被移除
        expect(fs.existsSync(path.join(outputDir, 'npminit'))).toBe(false);
        
    } catch (error) {
        console.error("CLI 执行失败:", error);
        throw error;
    }
  }, 60000); // 60秒超时
});
