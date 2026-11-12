#!/usr/bin/python
# -*- coding: utf-8 -*-

# Copyright: (c) 2022, Adam Mizerski <adam@mizerski.pl>
# GNU General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)

ANSIBLE_METADATA = {
    'metadata_version': '1.1',
    'status': ['preview'],
    'supported_by': 'community'
}

DOCUMENTATION = r'''
---
module: jq

short_description: apply jq on remote file

description:
  - Apply jq on remote file

options:
  path:
    description:
      - File to work on
    required: true
  filter:
    description:
      - Filter to apply
    required: true
  args:
    description:
      - Arguments to pass
    type: dict
  modify:
    description:
      - Overwrite the file with the jq result
    type: bool

seealso:
  - name: jq
    description: jq Manual
    link: https://stedolan.github.io/jq/manual/

author:
  - Adam Mizerski <adam@mizerski.pl>
'''

EXAMPLES = r'''
- name: Get value
  jq:
    path: file.json
    filter: ".value"
- name: Set value
  jq:
    path: file.json
    filter: ".vaule = $new_value"
    args:
      new_vaule: "{{ new_value }}"
    modify: yes
'''

RETURN = r'''
value:
    description: Output json
    type: json
    returned: always
'''

import json
import yaml

from ansible.module_utils.basic import AnsibleModule


def json_load(path):
    with open(path) as f:
        return json.load(f)


def flatten(l):
    return sum(l, [])


def jq_apply(module):
    _, stdout, _ = module.run_command(
        ["/usr/bin/jq", "-M", "-S"]
        + flatten((["--arg", k, v] for k, v in (module.params['args'] or {}).items()))
        + [module.params['filter'], module.params['path']],
        check_rc=True,
    )
    return stdout, json.loads(stdout)


def run_module():
    module_args = {
        'path': {
            'type': 'str',
            'required': True,
        },
        'filter': {
            'type': 'str',
            'required': True,
        },
        'args': {
            'type': 'dict',
            'required': False,
        },
        'modify': {
            'type': 'bool',
            'default': False,
        }
    }

    result = {
        'diff': {
            'before': None,
            'after': None,
        },
        'changed': False,
    }

    module = AnsibleModule(
        argument_spec=module_args,
        supports_check_mode=True
    )

    file_pre = json_load(module.params['path'])
    file_post_raw, file_post = jq_apply(module)

    result['value'] = file_post

    if not module.params['modify']:
        module.exit_json(**result)
        return

    result['diff']['before'] = yaml.dump(file_pre)
    result['diff']['after'] = yaml.dump(file_post)

    if file_pre == file_post:
        module.exit_json(**result)

    result['changed'] = True

    if module.check_mode:
        module.exit_json(**result)

    with open(module.params['path'], 'w') as f:
        f.write(file_post_raw)

    module.exit_json(**result)


def main():
    run_module()


if __name__ == '__main__':
    main()
