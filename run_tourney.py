import subprocess
import time

def run_uci_test():
    print('--- RHIZOH ENGINE UCI TEST ---')
    p = subprocess.Popen(['.\\target\\release\\castle.exe'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    commands = ['uci\n', 'isready\n', 'ucinewgame\n', 'position startpos moves e2e4 e7e5\n', 'go\n', 'quit\n']
    for cmd in commands:
        p.stdin.write(cmd)
        p.stdin.flush()
        time.sleep(0.1)
    
    stdout, _ = p.communicate()
    print(stdout)

if __name__ == '__main__':
    run_uci_test()
