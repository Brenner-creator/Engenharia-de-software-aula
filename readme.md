Para abrir essa tela, rode em dois terminais: npm run dev e npm run web:dev; acesse http://localhost:5173

## Acessos

- **Aplicação:** http://localhost:5173
- **Documentação da API:** http://localhost:3000/api/docs
- **pgAdmin:** http://localhost:8080
- **Mailpit (e-mails de recuperação):** http://localhost:8025

### Conta administrativa de demonstração

- **E-mail:** `admin@stockhub.com`
- **Senha:** 'Brenner123456'


Para criar/preparar essa conta e os dados demonstrativos, defina `SEED_ADMIN_PASSWORD` com uma senha de pelo menos 12 caracteres no ambiente local e execute:

```powershell
npm run db:seed
```

O seed atualiza a senha da conta administrativa para o valor configurado toda vez que é executado. Não coloque uma senha real neste README nem a envie para o Git.

### Acesso de usuário comum

- **E-mail:** `brenner123@gmail.com`
- **Senha:** 'Brenner123456'

Na tela de login, use **Criar conta** para cadastrar um usuário. O cadastro recebe automaticamente o papel `USER`; para ter a conta administrativa, use o procedimento de seed acima.