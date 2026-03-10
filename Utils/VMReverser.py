import base64
import json
import random




class VMReverser:
    
    def __init__(self, t, key):
        self.t = t
        self.key = key
        self.PROGRAM = {
            0: 'LOAD_PROGRAM', 1: 'XOR_REG', 2: 'SET', 3: 'RESOLVE', 4: 'REJECT',
            5: 'ADD', 6: 'GET_INDEX', 7: 'CALL', 8: 'COPY', 9: 'IP', 10: 'window',
            11: 'SCRIPT_MATCH', 12: 'GET_VM', 13: 'TRY_CALL', 14: 'JSON_PARSE',
            15: 'JSON_STRINGIFY', 16: 'KEY', 17: 'TRY_CALL_RESULT', 18: 'ATOB',
            19: 'BTOA', 20: 'IF_EQUAL', 21: 'IF_NOT_CLOSE', 22: 'SUBROUTINE',
            23: 'IF_DEFINED', 24: 'BIND', 27: 'SUB', 29: 'LESS_THAN',
            30: 'DEFINE_FUNC', 33: 'MULTIPLY', 34: 'AWAIT', 35: 'DIVIDE'
        }
        self.REGISTERS = {}
        self.function_calls_try_result = {}
        self.window_reflect = {}
        self.pc = 0

    def xor_decrypt(self, data, key):
        
        result = ""
        for i in range(len(data)):
            result += chr(ord(data[i]) ^ ord(key[i % len(key)]))
        return result
    
    def btoa(self, value: str) -> str:
        return base64.b64encode(value.encode('latin-1')).decode('latin-1')

    def _get_first_array(self):
        decoded = base64.b64decode(self.t).decode('latin-1')
        decrypted = self.xor_decrypt(decoded, self.key)
        return json.loads(decrypted)

    def resolve_opcodes(self, program):
        opcode_map = {}
        copy_reg = None

        for instr in program:
            if not isinstance(instr, list) or len(instr) < 2:
                continue

            if instr[0] == 8 and copy_reg is None:
                copy_reg = instr[1]
                opcode_map[copy_reg] = 8
                continue

            if copy_reg and instr[0] == copy_reg and len(instr) == 3:
                target = instr[1]
                source = instr[2]
                if isinstance(source, (int, float)):
                    opcode_map[target] = opcode_map.get(source, source)

        for reg, op in opcode_map.items():
            name = self.OPCODES.get(op, f'UNKNOWN_{op}')
            #print(f"  r:{reg} → {op} ({name})")

        return opcode_map

    def decode_program(self, program):
        opcode_map = self.resolve_opcodes(program)
        decoded = []
        for instr in program:
            if not isinstance(instr, list):
                continue
            op = instr[0]
            real_op = opcode_map.get(op, op)
            decoded.append([real_op] + instr[1:])
        return decoded

    def find_subprograms(self, program):

        subprograms = []
        for instr in program:
            if not isinstance(instr, list) or len(instr) != 3:
                continue
            _, saved_reg, instructions_string = instr
            if isinstance(instructions_string, str) and len(instructions_string) > 100:
                subprograms.append((saved_reg, instructions_string))

        subprograms.sort(key=lambda x: len(x[1]), reverse=True)
        register,subprogram = subprograms[0]        
    
        for instr in program:
            if len(instr) == 5 and register in instr:
                decrypt_key = instr[-1]
                break
        
        return subprogram,decrypt_key    

    def decrypt_subprogram(self, b64_string, xor_key):
        decoded = base64.b64decode(b64_string).decode('latin-1')
        decrypted = self.xor_decrypt(decoded, xor_key)
        try:
            return json.loads(decrypted)
        except json.JSONDecodeError:
            return decrypted
        
    def _simulate_call(self, call_str):
    
        env = {
            'window["performance"]["now"]()': 412424.5,
            'window["Object"]["create"](None)': {},
            'window["document"]["createElement"]("div")': '<div></div>',
            'window["document"]["createElement"]("canvas")': '<canvas>',
            'window["Math"]["random"]()': random.random(),
            'window["Date"]["now"]()': 1771864460770,
            '<canvas>["getContext"]("webgl")': '<webgl_context>',
            '{\'placement\': \'replacement\'}["estimate"]()': {
                "quota": 296630877388,
                "usage": 913230,
                "usageDetails": {
                    "indexedDB": 913230
                }
            }
        }

        if call_str in env:
            return env[call_str]

        # WebGL Parameter-Abfragen
        if '<webgl_context>["getParameter"]' in call_str:
            if 'UNMASKED_VENDOR_WEBGL' in call_str:
                return 'Google Inc. (Intel)'
            if 'UNMASKED_RENDERER_WEBGL' in call_str:
                return 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL 4.6)'

        if '<webgl_context>["getExtension"]' in call_str:
            if 'WEBGL_debug_renderer_info' in call_str:
                return '<webgl_debug_ext>'

        if '<webgl_debug_ext>' in call_str or 'UNMASKED' in call_str:
            if '37445' in call_str:
                return 'Intel'
            if '37446' in call_str:
                return 'Mesa Intel(R) UHD Graphics 630 (CFL GT2)'

        if "getBoundingClientRect" in call_str:
            return {"x":0,"y":744.6875,"width":19.640625,"height":14,"top":744.6875,"right":19.640625,"bottom":758.6875,"left":0}

        if "Object" in call_str and "keys" in call_str and "localStorage" in call_str:
            return "d2bd098fc8793ef1,statsig.session_id.444584300,statsig.last_modified_time.evaluations,statsig.stable_id.444584300,6fbbfe1cd1015f3d,statsig.cached.evaluations.3523433505"

        if "getTimezoneOffset" in call_str:
            return -60

        if "toLocaleString" in call_str:
            return "24/02/2026, 17:34:21"
        return None
    
    def _simulate_screen_value(self, key, default):
        
        screen = {"availWidth":2560,"availHeight":1410,"availLeft":-318,"availTop":-1410,"colorDepth":24,"height":1440,"width":2560,"pixelDepth":24}
        return screen.get(key, default) 

    def handle_copy(self, args):

        saving_register = args[0]
        value = args[1]
        self.PROGRAM[saving_register] = self.PROGRAM[value]
        print(f'[CURRENT PC: {self.pc} | COPY] Saving Register - {saving_register} Value - {value}({self.PROGRAM[value]})')

    def handle_set(self, args):

        register, value = args

        if value == 'window["history"]["length"]':
            value = 17
        elif value == 'window["document"]["location"]':
            value = "https://chatgpt.com/c/699f0077-aa5c-8395-af47-2a6d66d30620"
        
        elif value == 'window["navigator"]["storage"]':
            value = {"placement": "replacement"}

        self.REGISTERS[register] = value
        if isinstance(value, str):
            value = value[:50]
        print(f'[CURRENT PC: {self.pc} | SET] Register - {register} Value - {value}')
        return value

    def handle_get_index(self, args):

        to_register = args[0]
        container_reg = args[1]
        index_reg = args[2]
        if container_reg in self.PROGRAM.keys():
            main_container = self.PROGRAM[container_reg]
        elif container_reg in self.REGISTERS.keys():
            main_container = self.REGISTERS[container_reg]
        if index_reg in self.PROGRAM.keys():
            key = self.PROGRAM.get(index_reg)
        elif index_reg in self.REGISTERS.keys():
            key = self.REGISTERS.get(index_reg)

        str_result = f'{main_container}["{key}"]'
        if isinstance(main_container, dict):
            str_result = main_container[key]
        print(f'[CURRENT PC: {self.pc} | GET_INDEX] TO_REGISTER - {to_register} Value - {str_result}')
        return self.handle_set([to_register, str_result])
 
    def handle_xor(self, args):

        saving_register = args[0]
        if saving_register in self.PROGRAM.keys():
            value = self.PROGRAM.get(saving_register)
        elif saving_register in self.REGISTERS.keys():
            value = self.REGISTERS.get(saving_register)
        
        key_register = args[1]
        if key_register in self.PROGRAM.keys():
            key = self.PROGRAM.get(key_register)
        elif key_register in self.REGISTERS.keys():
            key = self.REGISTERS.get(key_register)

        result = self.xor_decrypt(str(value), str(key))
        return self.handle_set([saving_register, result])

    def handle_btoa(self, args):
        val = self.REGISTERS[args[0]]
        btoa_val = self.btoa(str(val))
        return self.handle_set([args[0], btoa_val])

    def handle_bind(self, args):

        to_register = args[0]
        container_reg = args[1]
        key_reg = args[2]

        container = self.PROGRAM.get(container_reg) or self.REGISTERS.get(container_reg)
        key = self.PROGRAM.get(key_reg) or self.REGISTERS.get(key_reg)

        result = f'{container}["{key}"]'
        return self.handle_set([to_register, result])

    def handle_try_call_result(self, args):

        to_register = args[0]
        fn_reg = args[1]
        call_arg_regs = args[2:]

        fn_expr = self.PROGRAM.get(fn_reg) or self.REGISTERS.get(fn_reg)

        arg_exprs = []
        for a in call_arg_regs:
            v = self.PROGRAM.get(a) or self.REGISTERS.get(a)
            if isinstance(v, str):
                arg_exprs.append(f'"{v}"')
            else:
                arg_exprs.append(str(v))

        call_str = f"{fn_expr}({', '.join(arg_exprs)})"
        value = self._simulate_call(call_str)
        return self.handle_set([to_register, value])
    
    def handle_if_defined(self, args):

        value = None
        register = args[0]
        if register in self.PROGRAM.keys():
            value = self.PROGRAM.get(register)
        elif register in self.REGISTERS.keys():
            value = self.REGISTERS.get(register)

        if value:

            opcode = args[1]
            opcode_name = self.PROGRAM[opcode]
            new_args = args[2:]
            return self.handle_opcode(args=new_args, operation_name=opcode_name, pc=self.pc)

    def handle_atob(self,args):

        register = args[0]
        value = self.REGISTERS.get(register)
        decoded = base64.b64decode(str(value)).decode('latin-1')
        return self.handle_set([register, decoded])

    def handle_json_parse(self, args):

        register = args[1]
        if register in self.PROGRAM.keys():
            value = self.PROGRAM.get(register)
        elif register in self.REGISTERS.keys():
            value = self.REGISTERS.get(register)

        parsed = json.loads(value)
        self.handle_set([args[0],parsed])
        return parsed

    def handle_call(self, args):

        fn_reg = args[0]
        call_arg_regs = args[1:]

        fn_expr = self.PROGRAM.get(fn_reg) or self.REGISTERS.get(fn_reg)

        arg_exprs = []
        for a in call_arg_regs:
            v = self.PROGRAM.get(a) or self.REGISTERS.get(a)
            arg_exprs.append(v)

        if fn_expr == "RESOLVE":
            value = arg_exprs[-1]
            return self.btoa(str(value))

        if fn_expr and "Reflect" in str(fn_expr) and "set" in str(fn_expr):
            obj, key, val = arg_exprs[0], arg_exprs[1], arg_exprs[2]
            if isinstance(obj, dict):
                obj[key] = self._simulate_screen_value(key, val)
            return

        call_str = f"{fn_expr}({', '.join(str(a) for a in arg_exprs)})"
        print(f"[CALL] {call_str}")

    def handle_add(self, args):

        target = args[0]
        source = args[1]

        current = self.REGISTERS.get(target)
        value = self.REGISTERS.get(source)

        if isinstance(current, list):
            current.append(value)
        elif isinstance(current, (int, float)) and isinstance(value, (int, float)):
            return self.handle_set([target, current + value])
        else:
            return self.handle_set([target, str(current) + str(value)])

    def handle_try_call(self, args):

        register_of_function = args[1]
        call_arg_regs = args[2:]
        return self.handle_opcode(call_arg_regs, self.PROGRAM.get(register_of_function), self.pc)
    
    def handle_json_stringify(self, args):
        target = args[0]
        source = args[1]
        value = self.REGISTERS.get(source)
        if isinstance(value, str):
            if value == 'window["navigator"]["hardwareConcurrency"]':
                val = 10
                result = json.dumps(val, separators=(",", ":"))
            elif value == 'window["navigator"]["deviceMemory"]':
                val = 8
                result = json.dumps(val, separators=(",", ":"))
        
        elif isinstance(value, list):
            if 'window["__reactRouterContext"]["state"]["loaderData"]["root"]["clientBootstrap"]["cfConnectingIp"]' in value:
                result = "\"TypeError: Cannot read properties of undefined (reading 'clientBootstrap')undefinedundefinedundefinedundefinedundefined\""
            elif 'window["navigator"]["vendor"]':
                val = ["Google Inc.","MacIntel",8,0]
                result = json.dumps(val,separators=(",", ":"))
        elif isinstance(value, dict):
            result = json.dumps(value,separators=(",", ":"))
        return self.handle_set([target, result])
    
    def handle_if_equal(self, args):
        reg_t = args[0]
        reg_e = args[1]
        fn_reg = args[2]
        fn_args = args[3:]

        # Werte aus Registern holen
        val_t = self.REGISTERS.get(reg_t, self.PROGRAM.get(reg_t))
        val_e = self.REGISTERS.get(reg_e, self.PROGRAM.get(reg_e))

        print(f'[CURRENT PC: {self.pc} | IF_EQUAL] reg[{reg_t}]={val_t} === reg[{reg_e}]={val_e} ?')

        if val_t == val_e:
            opcode_name = self.PROGRAM.get(fn_reg)
            if opcode_name:
                #print(f'  → TRUE, calling {opcode_name}({fn_args})')
                return self.handle_opcode(args=fn_args, operation_name=opcode_name, pc=self.pc)
            else:
                # fn_reg zeigt auf eine Funktion im Register
                fn = self.REGISTERS.get(fn_reg)
                #print(f'  → TRUE, calling reg[{fn_reg}]={fn}({fn_args})')
                return None
        else:
            #print(f'  → FALSE, skipping')
            return None
        
    def handle_await(self, args):

        register_val = self.REGISTERS[args[1]]
        self.handle_set([args[0], register_val])


    def handle_opcode(self, args: list, operation_name: str, pc):

        if operation_name == "COPY":
            
            return self.handle_copy(args)

        elif operation_name == "SET":

            return self.handle_set(args)

        elif operation_name == "GET_INDEX":
            
            return self.handle_get_index(args)
            

        elif operation_name == "BIND":
            
            return self.handle_bind(args)
        
        
        elif operation_name == "TRY_CALL_RESULT":
            
            return self.handle_try_call_result(args)
            

        elif operation_name == "XOR_REG":
            
            return self.handle_xor(args)
            

        elif operation_name == "BTOA":

            return self.handle_btoa(args)

        elif operation_name == "IF_DEFINED":

            return self.handle_if_defined(args)
            

        elif operation_name == "ATOB":
            
            return self.handle_atob(args)

            
        elif operation_name == "JSON_PARSE":
            
            return self.handle_json_parse(args)

        elif operation_name == "ADD":
            
            return self.handle_add(args)

        elif operation_name == "CALL":

            return self.handle_call(args)

        elif operation_name == "JSON_STRINGIFY":
            
            self.handle_json_stringify(args)


        elif operation_name == "TRY_CALL":

            return self.handle_try_call(args)

        elif operation_name == "IF_EQUAL":

            return self.handle_if_equal(args)

        elif operation_name == "SUBROUTINE":

            return self.disasm_program(args[1], False)
        
        elif operation_name == "AWAIT":

            return self.handle_await([args][0])

    def disasm_program(self, program, count_pc: True):
        for _, instruction in enumerate(program):
            opcode = instruction[0]
            args = instruction[1:]
            if opcode in self.PROGRAM:
                operation_name = self.PROGRAM[opcode]
                value = self.handle_opcode(args, operation_name, self.pc)
            
            if count_pc:
                self.pc += 1

        return value

            
    def _find_program(self):
        for key, val in self.REGISTERS.items():
            if isinstance(val, list) and len(val) > 10:
                return val
        return None

    def dump_all(self):
        init_program = self._get_first_array()
        disasm_init = self.disasm_program(init_program, True)
        second_program = self._find_program()
        disasm_second_program = self.disasm_program(second_program, True)
        token = self.disasm_program(disasm_second_program, True)
        print(f'[+] SUCCESS {token}')
        return token


